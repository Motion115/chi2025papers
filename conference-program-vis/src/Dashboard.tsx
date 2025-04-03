import React, { useEffect, useRef, useState } from "react";
import CircularSOM from "./components/CircularSOM";
import {
  Alert,
  Card,
  Flex,
  Skeleton,
  Space,
  Tabs,
  TabsProps,
  Typography,
} from "antd";
import { decode } from "@msgpack/msgpack";
import { ContentSpec } from "./types";
import {
  useAuthorLookup,
  useContentLookup,
  useEmbedding,
  useRelationshipLookup,
} from "./store";
import SearchBar from "./components/SearchBar";
import DimReduction from "./components/DimReduction";
import PaperContent from "./components/PaperContent";
import { CSSPageConfig } from "./style/styleConfigs";

const { Title, Text, Link } = Typography;

async function loadMsgPackData<T = ContentSpec[]>(
  fileName: string,
  setGlobalState: (data: T) => void
) {
  try {
    const response = await fetch(fileName);
    if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);

    const arrayBuffer = await response.arrayBuffer();
    const decodedData = decode(arrayBuffer) as T;
    // console.log(fileName, decodedData);
    setGlobalState(decodedData);
  } catch (err) {
    console.error("MessagePack loading error:", err);
  }
}

const Dashboard: React.FC = () => {
  const { contentLookup, setContentLookup } = useContentLookup();
  const { authorLookup, setAuthorLookup } = useAuthorLookup();
  const {
    relationshipLookup,
    setRelationshipLookup,
    appendRelationshipLookup,
  } = useRelationshipLookup();
  const { embedding, setEmbedding } = useEmbedding();

  const [searchId, setSearchId] = useState<string>("188659");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedScatterId, setSelectedScatterId] = useState<string>("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setSelectedId("");
  }, [searchId]);

  const [displayPortHeight, setDisplayPortHeight] = useState<number>(
    window.innerHeight
  );

  useEffect(() => {
    loadMsgPackData("/chi2025papers/content_lookup.msgpack", setContentLookup);
    loadMsgPackData("/chi2025papers/people_lookup.msgpack", setAuthorLookup);
    loadMsgPackData("/chi2025papers/embedMap.msgpack", setEmbedding);
  }, []);

  useEffect(() => {
    if (searchId && contentLookup) {
      const loadId = contentLookup[searchId].shardId;
      if (!(searchId in searchHistory)) {
        setSearchHistory([...searchHistory, searchId]);
        loadMsgPackData(
          `/chi2025papers/shards/content_${loadId}.msgpack`,
          appendRelationshipLookup
        );
      }
    }
  }, [searchId, contentLookup]);

  const [view, setView] = useState<string>("circular");

  const onChangeView = (key: string) => {
    setView(key);
  };

  const TabItems: TabsProps["items"] = [
    {
      key: "circular",
      label: "Query Retrieval View",
    },
    {
      key: "scatter",
      label: "Scatter Plot Dimensionality Reduction View",
    },
  ];

  const CircularView = (
    <>
      {/* {embedding && contentLookup && (
          <div style={{ width: "70%", height: "60vh", maxHeight: "100%" }}>
            <DimReduction data={embedding} contentLookup={contentLookup} />
          </div>
        )} */}
      <Text type="secondary">
        <ul>
          <li>
            <b>Panels</b>: The leftmost panel is the{" "}
            <Link href="https://github.com/RyanQ96/VADIS" target="_blank">
              <b>Circular SOM visualization</b>
            </Link>{" "}
            (adapted from VADIS, best paper of VIS'24) with the{" "}
            <b>seed paper</b> you selected, with details of the seed paper
            displayed on the <b>seed paper card</b> adjacent to the Circular SOM
            visualization. The rightmost panel (hidden by default) is the{" "}
            <b>relevant paper card</b>, which can be triggered from clicking the
            dots on Circular SOM. Within the two paper cards, the in situ author
            visualization is powered by{" "}
            <Link href="https://github.com/motion115/GistVis/" target="_blank">
              <b>GistVis</b>
            </Link>{" "}
            (repurposed from the visualizer module of our honorable mention
            paper at CHI'25).
          </li>
          <li>
            <b>Reading Circular SOM</b>: The "relavance" of paper decay on the
            radius, which is also double encoded by the opacity of each dot.
            Similar papers are visualized in proximity with each other, with the
            colors indicating a potential cluster (default 8 clusters for visual
            separatability).
          </li>
          <li>
            <b>Reading Author Visualization</b>: The bar chart shows how many
            papers each author published in CHI'25 (e.g., this can indicate who
            might be the senior researchers of the paper). You can hover on the
            authors or the bar chart interactively observe the author's record.
          </li>
          <li>
            <b>Control</b>: Use the <b>drop down</b> to search and select seed
            paper. After selecting seed paper, the Circular SOM is dynamically
            loaded, with the center representing the seed paper. Drag the{" "}
            <b>slider</b> to zoom in or out. <b>Tooltip on the slider</b> shows
            how many paper is currently visualized in the panel (50 paper
            intervals). <b>Hover</b> on each dot to see the paper title, and{" "}
            <b>click</b> to load detailed information on{" "}
            <b>relevant paper card</b>.
          </li>
        </ul>
      </Text>
      {contentLookup && (
        <SearchBar
          data={contentLookup}
          setSearchId={setSearchId}
          defaultSearch={contentLookup[searchId]?.title || ""}
        />
      )}
      {relationshipLookup && contentLookup && authorLookup && (
        <Flex gap="large">
          <div style={{ width: "30%", maxHeight: "60vh", height: "60vh" }}>
            <CircularSOM
              data={
                relationshipLookup.find(
                  (item) => item.id.toString() === searchId
                ) || relationshipLookup[0]
              }
              contentLookup={contentLookup}
              setClicked={setSelectedId}
              searchId={searchId}
            />
          </div>
          <div style={{ width: "40%", overflow: "scroll", height: "60vh" }}>
            <Card title="Seed Paper" style={{ height: "100%" }}>
              <PaperContent
                paperId={searchId}
                contentLookup={contentLookup}
                authorLookup={authorLookup}
              />
            </Card>
          </div>

          <div style={{ width: "40%", overflow: "scroll", height: "60vh" }}>
            <Card title="Relevant Paper" style={{ height: "100%" }}>
              {selectedId !== "" ? (
                <PaperContent
                  paperId={selectedId}
                  contentLookup={contentLookup}
                  authorLookup={authorLookup}
                />
              ) : (
                <Alert
                  message="Select a paper from the visualization to view its details here"
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </div>
        </Flex>
      )}
    </>
  );

  const ScatterView = (
    <>
      <Text type="secondary">
        <ul></ul>
      </Text>
      <Flex gap="large">
        {embedding && contentLookup && (
          <div style={{ width: "60%", height: "60vh", maxHeight: "100%" }}>
            <DimReduction
              data={embedding}
              contentLookup={contentLookup}
              setClicked={setSelectedScatterId}
            />
          </div>
        )}
        <div style={{ width: "40%", overflow: "scroll", height: "60vh" }}>
          <Card title="Selected Paper" style={{ height: "100%" }}>
            {relationshipLookup &&
            contentLookup &&
            authorLookup &&
            selectedScatterId !== "" ? (
              <PaperContent
                paperId={selectedScatterId}
                contentLookup={contentLookup}
                authorLookup={authorLookup}
              />
            ) : (
              <Alert
                message="Select a paper from the visualization to view its details here"
                type="info"
                showIcon
              />
            )}
          </Card>
        </div>
      </Flex>
    </>
  );

  return (
    <div>
      <Space direction="vertical" style={CSSPageConfig}>
        <Tabs items={TabItems} onChange={onChangeView} activeKey={view} />
        {view === "circular" ? (
          CircularView
        ) : view === "scatter" ? (
          ScatterView
        ) : (
          <div>View does not exist</div>
        )}
      </Space>
    </div>
  );
};

export default Dashboard;
