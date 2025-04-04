import * as d3 from "d3";
import { Alert, Flex, Skeleton, Slider, Spin, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  LoadingOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import {
  CircularSOMProps,
  ContentLookupSpec,
  RelationshipSpec,
  SomSpec,
} from "../types";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";

const { Paragraph, Text } = Typography;

interface CircularSOMSpec extends RelationshipSpec {
  circle_dist: number;
}

const CircularSOM: React.FC<CircularSOMProps> = ({
  data,
  contentLookup,
  searchId,
  setClicked,
  trigger
}) => {
  const [coordinateData, setCoordinateData] = useState<RelationshipSpec[]>(
    data.relationship
  );

  const [topK, setTopK] = useState<number>(100);

  const [displayPortDim, setDisplayPortDim] = useState<number>(1000);
  const PADDING = displayPortDim / Math.sqrt(topK * 12) + 5;
  const RADIUS = displayPortDim / Math.sqrt(topK * 12);

  const svgRef = useRef<SVGSVGElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sortedData: CircularSOMSpec[] = data.relationship
      .map((d) => ({
        ...d,
        circle_dist: Math.sqrt(d.circularPos[0] ** 2 + d.circularPos[1] ** 2),
      }))
      .sort((a, b) => a.circle_dist - b.circle_dist);
    // remove the paper that is the search query
    // sortedData = sortedData.filter((d) => d.id.toString() !== searchId);
    setCoordinateData(sortedData);
  }, [data]);

  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current && infoRef.current) {
        const usableHeight = parentRef.current.getBoundingClientRect().height - infoRef.current.getBoundingClientRect().height;
        const usableWidth = parentRef.current.getBoundingClientRect().width;
        const minDim = Math.min(usableHeight, usableWidth);
        setDisplayPortDim(minDim);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [parentRef, infoRef]);

  useEffect(() => {
    setTopK(100)
  }, [searchId])

  useEffect(() => {
    if (!svgRef.current || coordinateData.length === 0) return;

    const displayData = coordinateData.slice(0, topK);
    const svg = d3.select(svgRef.current);

    // Clear previous elements
    svg.selectAll("*").remove();

    // Set up scales
    const xRange = d3.extent(displayData, (d) => d.circularPos[0]) as [
      number,
      number
    ];
    const yRange = d3.extent(displayData, (d) => d.circularPos[1]) as [
      number,
      number
    ];
    const xScale = d3.scaleLinear(xRange, [PADDING, displayPortDim - PADDING]);
    const yScale = d3.scaleLinear(yRange, [displayPortDim - PADDING, PADDING]);
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
    const relevanceRange = d3.extent(displayData, (d) => {
      if (d.relevance != 1) return d.relevance;
    }) as [number, number];
    const opacityScale = d3.scaleLinear(relevanceRange, [0.2, 1]);

    // Create circles with combined hover effects
    const circles = svg
      .selectAll("circle")
      .data(displayData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d.circularPos[0]))
      .attr("cy", (d) => yScale(d.circularPos[1]))
      .attr("r", RADIUS)
      .attr("fill", (d) => {
        if (d.id.toString() === searchId) {
          return "grey"
        } else {
          return colorScale(d.category.toString())
        }
      })
      .style("opacity", (d) => opacityScale(d.relevance))
      .style("transform-origin", function (d) {
        return `${xScale(d.circularPos[0])}px ${yScale(d.circularPos[1])}px`;
      })
      .on("click", (_, d) => {
        setClicked(d.id.toString());
      })
      .on("mouseover", function (event: MouseEvent, d: RelationshipSpec) {
        d3.select(".tooltip").remove();
        // Scale effect
        d3.select(this)
          .transition()
          .duration(200)
          .style("transform", "scale(1.1)")
          .style("opacity", 1);

        const tooltipContent = (
          <>
              <Text style={{ fontWeight: "bold", display: "block" }}>
                {contentLookup[d.id].title}
              </Text>
            <Text type="secondary">
              Relevance score: {d.relevance.toFixed(3)}
            </Text>
          </>
        );

        const tooltipNode = document.createElement("div");
        const root = createRoot(tooltipNode);
        root.render(tooltipContent);

        // Create tooltip
        const tooltip = d3
          .select("body")
          .append(() => tooltipNode)
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("padding", "8px")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("z-index", "10")
          .style("display", "none")
          // .html(tooltipContent);

        // Get SVG dimensions
        const svgNode = svgRef.current;
        const svgRect = svgNode?.getBoundingClientRect();

        const updateTooltipPosition = () => {
          if (!svgRect) return;

          const tooltipWidth = 20;

          // Calculate circle position in SVG coordinates
          const circleX = xScale(d.circularPos[0]);
          const circleY = yScale(d.circularPos[1]);

          // Convert to page coordinates
          const { x: absoluteX, y: absoluteY } = getAbsolutePosition(
            svgRect,
            circleX,
            circleY
          );

          tooltip
            .style("display", "block")
            .style("width", `${tooltipWidth}rem`)
            .style("left", `${absoluteX + RADIUS * 2}px`);

          // get tooltip height (dynamically)
          const tooltipHeight = tooltip.node()?.getBoundingClientRect().height;
          if (tooltipHeight) {
            // Position tooltip above circle
            tooltip.style("top", `${absoluteY - tooltipHeight / 2}px`); // Position above circle
          }
        };

        updateTooltipPosition();
      })
      .on("mouseout", function (event: MouseEvent, d: RelationshipSpec) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("transform", "scale(1)")
          .style("opacity", opacityScale(d.relevance));
        d3.select(".tooltip").remove();
      });

    // default title
    // circles.append("title").text((d) => d.metadata.title);
  }, [coordinateData, topK, displayPortDim, RADIUS]);

  const getAbsolutePosition = (svgRect: DOMRect, x: number, y: number) => {
    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;

    const svg = svgRef.current;
    const transform = svg ? window.getComputedStyle(svg).transform : null;
    let scaleX = 1,
      scaleY = 1;

    if (transform && transform !== "none") {
      const matrix = new DOMMatrix(transform);
      scaleX = matrix.a;
      scaleY = matrix.d;
    }

    return {
      x: svgRect.left + x * scaleX + scrollX,
      y: svgRect.top + y * scaleY + scrollY,
    };
  };

  const handleSearchSpaceChange = (value: number) => {
    setTopK(value);
  };

  return (
    <>
      {data.relationship.length > 0 ? (
        <div ref={parentRef} style={{ height: "100%" }}>
          <div ref={infoRef}>
            <Flex justify="space-between">
              <ZoomInOutlined />
              <Slider
                min={0}
                max={coordinateData.length}
                value={topK}
                step={50}
                onChange={handleSearchSpaceChange}
                style={{ width: "90%" }}
              />
              <ZoomOutOutlined />
            </Flex>
          </div>
          <svg ref={svgRef} width={displayPortDim} height={displayPortDim} />
        </div>
      ) : (
        <div>
          <Spin
            tip={
              <>
                <Paragraph>Loading SOM projection...</Paragraph>
                <Paragraph>
                  SOM projection only exsist on Papers, Journals, LBW, Student
                  Research Competition, alt.CHI and Case Studies
                </Paragraph>
              </>
            }
          >
            <Skeleton.Node
              active
              style={{ width: "100%", height: displayPortDim }}
            />
          </Spin>
        </div>
      )}
    </>
  );
};

export default CircularSOM;
