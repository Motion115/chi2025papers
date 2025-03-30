import * as d3 from "d3";
import { Slider, Tooltip, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { ContentLookupSpec, RelationshipSpec, SomSpec } from "../types";

interface CircularSOMSpec extends RelationshipSpec {
  circle_dist: number;
}

interface CircularSOMProps {
  data: SomSpec;
  contentLookup: ContentLookupSpec
}

const CircularSOM: React.FC<CircularSOMProps> = ({ data, contentLookup }) => {
  const [coordinateData, setCoordinateData] =
    useState<RelationshipSpec[]>(data.relationship);

  const [topK, setTopK] = useState<number>(100);

  const [displayPortDim, setDisplayPortDim] = useState<number>(1000);
  const PADDING = displayPortDim / Math.sqrt(topK * 12) + 5;
  const RADIUS = displayPortDim / Math.sqrt(topK * 12);

  const svgRef = useRef<SVGSVGElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sortedData: CircularSOMSpec[] = data.relationship
      .map((d) => ({
        ...d,
        circle_dist: Math.sqrt(d.circularPos[0] ** 2 + d.circularPos[1] ** 2),
      }))
      .sort((a, b) => a.circle_dist - b.circle_dist);
    setCoordinateData(sortedData);
  }, [data]);

  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setDisplayPortDim(parentRef.current.getBoundingClientRect().width);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
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
      .attr("fill", (d) => colorScale(d.category.toString()))
      .style("opacity", (d) => opacityScale(d.relevance))
      .style("transform-origin", function (d) {
        return `${xScale(d.circularPos[0])}px ${yScale(d.circularPos[1])}px`;
      })
      // .on("click", (_, d) => {
      //   setTitle(d.metadata.title);
      //   setAbstract(d.metadata.abstract);
      // })
      .on("mouseover", function (event: MouseEvent, d: RelationshipSpec) {
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
          .html(
            contentLookup[d.id].title
          );

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
    <div ref={parentRef}>
      <Slider
        min={0}
        max={coordinateData.length}
        value={topK}
        step={50}
        onChange={handleSearchSpaceChange}
      />

      <svg
        ref={svgRef}
        width={displayPortDim}
        height={displayPortDim}
        style={{ width: "100%", height: displayPortDim }}
      />
    </div>
  );
};

export default CircularSOM;
