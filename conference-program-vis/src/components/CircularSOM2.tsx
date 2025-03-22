import * as d3 from "d3";
import { Tooltip } from 'antd';
import { useEffect, useState } from "react";

interface CircularSOMSpec2 {
  pos_x: number;
  pos_y: number;
  circle_x: number;
  circle_y: number;
  relevance: number;
  metadata: {
    session: string;
    abstract: string;
    title: string;
    id: number;
    sequence: number;
    content: string;
  }
  category_num: number;
}

const CircularSOM2 = () => {
  const QUERY = "Information visualization and Data Analytics";
  const [coordinateData, setCoordinateData] = useState<
    CircularSOMSpec2[]
  >([]);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");

  useEffect(() => {
    // read visualization.json
    d3.json("src/assets/rr.json").then((data) => {
      setCoordinateData(data as CircularSOMSpec2[]);
      console.log(data);
    });
  }, []);

  const width = 1000;
  const height = 1000;

  const xRange = d3.extent(
    coordinateData,
    (d) => d.circle_x
  ) as [number, number];
  const yRange = d3.extent(
    coordinateData,
    (d) => d.circle_y
  ) as [number, number];

  const xScale = d3.scaleLinear(xRange, [0, width]);
  const yScale = d3.scaleLinear(yRange, [height, 0]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  const relevanceRange = d3.extent(coordinateData, (d) => d.relevance) as [number, number];
  console.log(relevanceRange)

  const colorScale2 = d3.scaleSequential(d3.interpolateCool).domain(relevanceRange);

  return (
    <div>
      <svg style={{ width: width, height: height }}>
        {coordinateData &&
          coordinateData.map((d) => {
            return (
              <Tooltip title={d.metadata.title} key={d.metadata.id}>
                <circle
                  cx={xScale(d.circle_x)}
                  cy={yScale(d.circle_y)}
                  r={8}
                  // fill={colorScale(
                  //   [188659, 188633, 189350, 188719, 189050, 189232].includes(
                  //     d.metadata.id
                  //   )
                  //     ? "yes"
                  //     : "no"
                  // )}
                  // fill={colorScale(d.category_num.toString())}
                  fill={colorScale2(d.relevance)}
                  onClick={() => {
                    setTitle(d.metadata.title);
                    setAbstract(d.metadata.abstract);
                  }
                  }
                />
              </Tooltip>
            );
          })}
      </svg>
      <p style={{ textAlign: "left" }}>
        <b>{title}</b>
      </p>
      <p style={{ textAlign: "left" }}>{abstract}</p>
    </div>
  );
};

export default CircularSOM2;
