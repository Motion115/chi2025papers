import React, { useEffect, useRef, useState } from "react";
import CircularSOM from "./components/CircularSOM";
import {
  Alert,
  Card,
  Flex,
  Skeleton,
  Space,
  Spin,
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

const { Paragraph, Text, Link } = Typography;

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
    return true;
  } catch (err) {
    console.error("MessagePack loading error:", err);
    return false;
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

  const [displayPortDim, setDisplayPortDim] = useState<{
    width: number;
    height: number;
  }>({
    width: 20,
    height: 20,
  });

  const fullWindowRef = useRef<HTMLDivElement>(null);
  const [fullWindowDim, setFullWindowDim] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    if (!fullWindowRef.current) return;

    const updateWindowDimensions = () => {
      if (!fullWindowRef.current) return;
      const { width, height } = fullWindowRef.current.getBoundingClientRect();
      setFullWindowDim({ width, height });
    };
    updateWindowDimensions();
    const resizeObserver = new ResizeObserver(updateWindowDimensions);
    resizeObserver.observe(fullWindowRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [fullWindowRef.current]);

  const somRef = useRef<HTMLDivElement>(null);
  // get the height of the somRef
  useEffect(() => {
    if (somRef.current) {
      setDisplayPortDim({
        width: somRef.current.getBoundingClientRect().width,
        height: somRef.current.getBoundingClientRect().height,
      });
    }
  }, [somRef.current]);

  useEffect(() => {
    console.log("displayPortDim updated:", displayPortDim);
  }, [displayPortDim]);

  useEffect(() => {
    setSelectedId("");
  }, [searchId]);

  useEffect(() => {
    loadMsgPackData("/chi2025papers/content_lookup.msgpack", setContentLookup);
    loadMsgPackData("/chi2025papers/people_lookup.msgpack", setAuthorLookup);
    loadMsgPackData("/chi2025papers/embedMap.msgpack", setEmbedding);
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const WRAP_THRESHOLD = 1000;

  useEffect(() => {
    if (searchId && contentLookup) {
      setIsLoading(true);

      const loadId = contentLookup[searchId].shardId;

      if (!searchHistory.includes(searchId)) {
        setSearchHistory([...searchHistory, searchId]);
        loadMsgPackData(
          `/chi2025papers/shards/content_${loadId}.msgpack`,
          appendRelationshipLookup
        ).then((response) => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
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
      <Text>
        <ul>
          <li>
            <b>Panels</b>: The leftmost panel is the{" "}
            <Link href="https://github.com/RyanQ96/VADIS" target="_blank">
              Circular SOM visualization
            </Link>{" "}
            (Circular Self-Organizing Map) with the <b>anchor paper</b> you
            selected, with details of the anchor paper displayed on the{" "}
            <b>anchor paper card</b> adjacent to the Circular SOM visualization.
            The rightmost panel (hidden by default) is the{" "}
            <b>relevant paper card</b>, which can be triggered by clicking the
            dots on Circular SOM. The in situ author visualization is powered by{" "}
            <Link href="https://github.com/motion115/GistVis/" target="_blank">
              GistVis (@gistvis/wsv)
            </Link>
            . Embedding and relevance are calculated using the{" "}
            <Link
              href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"
              target="_blank"
            >
              SentenceBERT
            </Link>{" "}
            model.
          </li>
          <li>
            <b>Reading Circular SOM</b>: The "relevance" of paper decay on the
            radius, which is also double encoded by the opacity of each dot.
            Similar papers are visualized in proximity to each other, with the
            colors indicating a potential cluster (8 clusters from k-Means).
          </li>
          <li>
            <b>Reading Author Visualization</b>: The bar chart shows how many
            papers each author published in CHI'25 (e.g., this can indicate who
            might be the senior researchers of the paper). You can hover over
            the authors or the bar chart and interactively observe the author's
            record.
          </li>
          <li>
            <b>Controls</b>: Use the <b>drop-down</b> menu to search for and
            select anchor paper. After selecting the anchor paper, the Circular
            SOM is dynamically loaded, with the center representing the anchor
            paper. Drag the <b>slider</b> to zoom in or out.{" "}
            <b>Tooltip on the slider</b> shows how many paper is currently
            visualized in the panel (50 paper intervals). <b>Hover</b> on each
            dot to see the paper title, and <b>click</b> to load detailed
            information on <b>relevant paper card</b>.
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
      {relationshipLookup &&
        contentLookup &&
        authorLookup &&
        fullWindowDim !== null && (
          <Flex gap="large" wrap={fullWindowDim.width < WRAP_THRESHOLD}>
            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "30%",
                maxHeight: "60vh",
                height: "60vh",
                justifyContent: "center",
                alignItems: "center",
              }}
              ref={somRef}
            >
              {isLoading ? (
                <div>
                  <Spin
                    tip={
                      <>
                        <Paragraph>Loading SOM projection...</Paragraph>
                        <Paragraph>
                          SOM projection only exsist on Papers, Journals, LBW,
                          Student Research Competition, alt.CHI and Case Studies
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
              ) : (
                relationshipLookup &&
                contentLookup &&
                authorLookup && (
                  <CircularSOM
                    data={
                      relationshipLookup.find(
                        (item) => item.id.toString() === searchId
                      ) || relationshipLookup[0]
                    }
                    contentLookup={contentLookup}
                    setClicked={setSelectedId}
                    searchId={searchId}
                    trigger={displayPortDim.width}
                  />
                )
              )}
            </div>
            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "40%",
                overflowY: "scroll",
                height: "60vh",
              }}
            >
              <Card title="Anchor Paper">
                <PaperContent
                  paperId={searchId}
                  contentLookup={contentLookup}
                  authorLookup={authorLookup}
                  trigger={displayPortDim.width}
                />
              </Card>
            </div>

            <div
              style={{
                width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "40%",
                overflowY: "scroll",
                height: "60vh",
              }}
            >
              <Card title="Relevant Paper">
                {selectedId !== "" ? (
                  <PaperContent
                    paperId={selectedId}
                    contentLookup={contentLookup}
                    authorLookup={authorLookup}
                    trigger={displayPortDim.width}
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
      <Text>
        <ul>
          <li>
            <b>Panels</b>: The left panel is a <b>scatter plot</b> that projects
            the embedding from{" "}
            <Link
              href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"
              target="_blank"
            >
              SentenceBERT
            </Link>{" "}
            using title + abstract information. The right panel is the{" "}
            <b>paper card</b>, where you can view detailed information about the
            paper.
          </li>
          <li>
            <b>Reading Scatter Plot</b>: Similar papers are visualized in
            proximity, with the colors indicating a potential cluster (8
            clusters from k-Means).
          </li>
          <li>
            <b>Controls</b>: <b>Hover</b> on each dot to see the paper title and{" "}
            <b>click</b> to load detailed information on the <b>paper card</b>.
            You can also <b>switch</b> between two different dimensionality
            reduction algorithms: UMAP and t-SNE. The <b>award switch</b>{" "}
            highlights the best paper / honorable mention winners.
          </li>
        </ul>
      </Text>
      <Flex gap="large" wrap>
        {embedding && contentLookup && fullWindowDim !== null && (
          <div
            style={{
              width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "60%",
              height: "60vh",
              maxHeight: "100%",
            }}
          >
            <DimReduction
              data={embedding}
              contentLookup={contentLookup}
              setClicked={setSelectedScatterId}
              trigger={displayPortDim.width}
            />
          </div>
        )}
        {fullWindowDim !== null && (
          <div
            style={{
              width: fullWindowDim.width < WRAP_THRESHOLD ? "100%" : "30%",
              overflowY: "scroll",
              height: "60vh",
            }}
          >
            <Card title="Selected Paper">
              {relationshipLookup &&
              contentLookup &&
              authorLookup &&
              selectedScatterId !== "" ? (
                <PaperContent
                  paperId={selectedScatterId}
                  contentLookup={contentLookup}
                  authorLookup={authorLookup}
                  trigger={displayPortDim.width}
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
        )}
      </Flex>
    </>
  );

  return (
    <div ref={fullWindowRef}>
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
