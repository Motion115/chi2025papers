import React, { useEffect, useRef, useState } from "react";
import CircularSOM from "./components/CircularSOM";
import { Card, Flex, Space, Typography } from "antd";
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

const { Title, Text } = Typography;

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
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    setSelectedId("");
  }, [searchId])

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

  return (
    <Space
      direction="vertical"
      style={CSSPageConfig}
    >
      <>
        {contentLookup && (
          <SearchBar
            data={contentLookup}
            setSearchId={setSearchId}
            defaultSearch={contentLookup[searchId]?.title || ""}
          />
        )}
        {/* {embedding && contentLookup && (
          <div style={{ width: "70%", height: "60vh", maxHeight: "100%" }}>
            <DimReduction data={embedding} contentLookup={contentLookup} />
          </div>
        )} */}

        {relationshipLookup && contentLookup && authorLookup && (
          <Flex gap="large">
            <div style={{ width: "30%", maxHeight: "60vh", height: "60vh"}}>
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
              <Card title="Seed Paper">
                <PaperContent
                  paperId={searchId}
                  contentLookup={contentLookup}
                  authorLookup={authorLookup}
                />
              </Card>
            </div>
            {selectedId !== "" && (
              <div style={{ width: "40%", overflow: "scroll", height: "60vh" }}>
                <Card title="Relevant Paper">
                  <PaperContent
                    paperId={selectedId}
                    contentLookup={contentLookup}
                    authorLookup={authorLookup}
                  />
                </Card>
              </div>
            )}
          </Flex>
        )}
      </>
    </Space>
  );
};

export default Dashboard;
