import * as d3 from "d3";
import {
  Flex,
  Radio,
  RadioChangeEvent,
  Skeleton,
  Spin,
  Switch,
  Tooltip,
  Typography,
} from "antd";
import { useEffect, useRef, useState } from "react";
import { DimReductionProps, EmbeddingSpec } from "../types";
import { createRoot } from "react-dom/client";

const { Paragraph, Text } = Typography;

type DimReductionTechnique = "tsne" | "umap";

const DimReduction: React.FC<DimReductionProps> = ({
  data,
  contentLookup,
  setClicked,
  trigger
}) => {
  const [coordinateData, setCoordinateData] = useState<EmbeddingSpec[]>(data);
  const [projectionTechnique, setProjectionTechnique] =
    useState<DimReductionTechnique>("umap");
  const [displayPortDim, setDisplayPortDim] = useState<{
    width: number;
    height: number;
  }>({ width: 20, height: 20 });
  const PADDING = 5;
  const [RADIUS, setRADIUS] = useState(3);
  
  const [isAll, setIsAll] = useState(true);

  const svgRef = useRef<SVGSVGElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!parentRef.current) return;

    const updateSize = () => {
      if (parentRef.current && infoRef.current) {
        const rect = parentRef.current.getBoundingClientRect();
        const infoRect = infoRef.current.getBoundingClientRect();
        setDisplayPortDim({
          width: rect.width,
          height: rect.height - infoRect.height,
        });
        setRADIUS(Math.min(rect.width, rect.height) / 120);
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
    const xRange = d3.extent(displayData, (d) => d[projectionTechnique][0]) as [
      number,
      number
    ];
    const yRange = d3.extent(displayData, (d) => d[projectionTechnique][1]) as [
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
    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    // Create circles with combined hover effects
    const circles = svg
      .selectAll("circle")
      .data(displayData)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[projectionTechnique][0]))
      .attr("cy", (d) => yScale(d[projectionTechnique][1]))
      .attr("r", RADIUS)
      .attr("fill", (d) => colorScale(d.category.toString()))
      .attr("opacity", (d) => {
        if (isAll === false) {
          if (contentLookup[d.id].award !== "") return 0.8;
          else return 0.1;
        } else return 0.35;
      })
      .style("transform-origin", function (d) {
        return `${xScale(
          d[projectionTechnique][0]
        )}px ${yScale(d[projectionTechnique][1])}px`;
      })
      .on("click", (_, d) => {
        setClicked(d.id.toString());
      })
      .on("mouseover", function (event: MouseEvent, d: EmbeddingSpec) {
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
          .style("display", "none");
        // .html(contentLookup[d.id].title);

        // Get SVG dimensions
        const svgNode = svgRef.current;
        const svgRect = svgNode?.getBoundingClientRect();

        const updateTooltipPosition = () => {
          if (!svgRect) return;

          const tooltipWidth = 20;

          // Calculate circle position in SVG coordinates
          const circleX = xScale(d[projectionTechnique][0]);
          const circleY = yScale(d[projectionTechnique][1]);

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
          .style("opacity", () => {
            if (isAll === false) {
              if (contentLookup[d.id].award !== "") return 0.8;
              else return 0.1;
            } else return 0.35;
          });
        d3.select(".tooltip").remove();
      });

    // default title
    // circles.append("title").text((d) => d.metadata.title);
  }, [coordinateData, displayPortDim, RADIUS, projectionTechnique, isAll]);

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

  const DimReductionOptions = [
    {
      value: "tsne" as DimReductionTechnique,
      label: "TSNE",
    },
    {
      value: "umap" as DimReductionTechnique,
      label: "UMAP",
    },
  ];

  const onChangeProjectionTechnique = (e: RadioChangeEvent) => {
    setProjectionTechnique(e.target.value as DimReductionTechnique);
  };


  return (
    <>
      {data ? (
        <div ref={parentRef} style={{ height: "100%" }}>
          <div ref={infoRef}>
            <Flex gap="middle" wrap>
              <Text style={{ fontWeight: "bold" }}>Projection algorithm:</Text>
              <Radio.Group
                onChange={onChangeProjectionTechnique}
                value={projectionTechnique}
                options={DimReductionOptions}
              />
              <Text style={{ fontWeight: "bold" }}>Award Filter:</Text>
              <Switch
                checked={!isAll}
                onChange={(state) => setIsAll(!isAll)}
                checkedChildren="On"
                unCheckedChildren="Off"
              />
            </Flex>
          </div>
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
