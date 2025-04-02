import * as d3 from "d3";
import { Alert, Flex, Skeleton, Slider, Spin, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import {
  ContentLookupSpec,
  DimReductionProps,
  EmbeddingSpec,
  RelationshipSpec,
  SomSpec,
} from "../types";

const { Paragraph } = Typography;

type DimReductionTechnique = "tsne" | "umap";

const DimReduction: React.FC<DimReductionProps> = ({ data, contentLookup }) => {
  const [coordinateData, setCoordinateData] = useState<EmbeddingSpec[]>(data);

  const [mappingTechnique, setMappingTechnique] =
    useState<DimReductionTechnique>("umap");

  const [displayPortDim, setDisplayPortDim] = useState<{
    width: number;
    height: number;
  }>({ width: 20, height: 20 });
  const PADDING = 5;
  const RADIUS = 5;

  const svgRef = useRef<SVGSVGElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentRef.current) return;

    const updateSize = () => {
      if (parentRef.current) {
        const rect = parentRef.current.getBoundingClientRect();
        setDisplayPortDim({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(parentRef.current);

    updateSize();

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !coordinateData) return;

    const displayData = coordinateData;
    const svg = d3.select(svgRef.current);

    // Clear previous elements
    svg.selectAll("*").remove();

    // Set up scales
    const xRange = d3.extent(displayData, (d) => d[mappingTechnique][0]) as [
      number,
      number
    ];
    const yRange = d3.extent(displayData, (d) => d[mappingTechnique][1]) as [
      number,
      number
    ];
    const xScale = d3.scaleLinear(xRange, [
      PADDING,
      displayPortDim.width - PADDING,
    ]);
    const yScale = d3.scaleLinear(yRange, [
      displayPortDim.height - PADDING,
      PADDING,
    ]);
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create circles with combined hover effects
    const circles = svg
      .selectAll("circle")
      .data(displayData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[mappingTechnique][0]))
      .attr("cy", (d) => yScale(d[mappingTechnique][1]))
      .attr("r", RADIUS)
      .attr("fill", (d) => colorScale(d.category.toString()))
      .attr("opacity", 0.35)
      .style("transform-origin", function (d) {
        return `${xScale(
          d[mappingTechnique][0]
        )}px ${yScale(d[mappingTechnique][1])}px`;
      })
      // .on("click", (_, d) => {
      //   setTitle(d.metadata.title);
      //   setAbstract(d.metadata.abstract);
      // })
      .on("mouseover", function (event: MouseEvent, d: EmbeddingSpec) {
        d3.select(".tooltip").remove();
        // Scale effect
        d3.select(this)
          .transition()
          .duration(200)
          .style("transform", "scale(1.1)")
          .style("opacity", 1);

        // Create tooltip
        const tooltip = d3
          .select("body")
          .append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "white")
          .style("padding", "8px")
          .style("border", "1px solid #ddd")
          .style("border-radius", "4px")
          .style("pointer-events", "none")
          .style("z-index", "10")
          .style("display", "none")
          .html(contentLookup[d.id].title);

        // Get SVG dimensions
        const svgNode = svgRef.current;
        const svgRect = svgNode?.getBoundingClientRect();

        const updateTooltipPosition = () => {
          if (!svgRect) return;

          const tooltipWidth = 20;

          // Calculate circle position in SVG coordinates
          const circleX = xScale(d[mappingTechnique][0]);
          const circleY = yScale(d[mappingTechnique][1]);

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
      .on("mouseout", function (event: MouseEvent, d: EmbeddingSpec) {
        d3.select(this)
          .transition()
          .duration(200)
          .style("transform", "scale(1)")
          .style("opacity", 0.35);
        d3.select(".tooltip").remove();
      });

    // default title
    // circles.append("title").text((d) => d.metadata.title);
  }, [coordinateData, displayPortDim, RADIUS, mappingTechnique]);

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

  return (
    <>
      {data ? (
        <div ref={parentRef} style={{ height: "100%"}}>
          {/* <Slider
            min={0}
            max={coordinateData.length}
            value={topK}
            step={50}
            onChange={handleSearchSpaceChange}
          /> */}
          <svg
            ref={svgRef}
            width={displayPortDim.width}
            height={displayPortDim.height}
          />
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
              style={{
                width: displayPortDim.width,
                height: displayPortDim.height,
              }}
            />
          </Spin>
        </div>
      )}
    </>
  );
};

export default DimReduction;
