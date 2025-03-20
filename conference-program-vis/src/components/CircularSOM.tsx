import * as d3 from "d3";
import { Tooltip } from 'antd';
import { useEffect, useState } from "react";

interface CircularSOMSpec {
  session: string;
  abstract: string;
  title: string;
  id: number;
  sequence: number;
  queryCoordinates: Record<string, number[]>;
  label: Record<string, number>;
}

const CircularSOM = () => {
  const QUERY = "Information visualization and Data Analytics";
  const [coordinateData, setCoordinateData] = useState<
    CircularSOMSpec[]
  >([]);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");

  useEffect(() => {
    // read visualization.json
    d3.json("src/assets/circularSOMVis.json").then((data) => {
      setCoordinateData(data as CircularSOMSpec[]);
      console.log(data);
    });
  }, []);

  const width = 1000;
  const height = 1000;

  const xRange = d3.extent(
    coordinateData,
    (d) => d.queryCoordinates[QUERY][0]
  ) as [number, number];
  const yRange = d3.extent(
    coordinateData,
    (d) => d.queryCoordinates[QUERY][1]
  ) as [number, number];

  const xScale = d3.scaleLinear(xRange, [0, width]);
  const yScale = d3.scaleLinear(yRange, [height, 0]);

  const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

  return (
    <div>
      <svg style={{ width: width, height: height }}>
        {coordinateData &&
          coordinateData.map((d) => {
            return (
              <Tooltip title={d.title} key={d.id}>
                <circle
                  cx={xScale(d.queryCoordinates[QUERY][0])}
                  cy={yScale(d.queryCoordinates[QUERY][1])}
                  r={8}
                  // fill={colorScale(
                  //   [188659, 188633, 189350, 188719, 189050, 189232].includes(
                  //     d.id
                  //   )
                  //     ? "yes"
                  //     : "no"
                  // )}
                  fill={colorScale(d.label[QUERY].toString())}
                  onClick={() => {
                    setTitle(d.title);
                    setAbstract(d.abstract);
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

export default CircularSOM;
