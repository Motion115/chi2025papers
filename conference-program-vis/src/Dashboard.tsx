import React, { useEffect, useState } from "react";
import CircularSOM from "./components/CircularSOM";
import { Flex } from "antd";
import { decode } from "@msgpack/msgpack";
import { ContentSpec } from "./types";
import {
  useAuthorLookup,
  useContentLookup,
  useRelationshipLookup,
} from "./store";
import SearchBar from "./components/SearchBar";

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
  const { relationshipLookup, setRelationshipLookup, appendRelationshipLookup } = useRelationshipLookup();

  const [searchId, setSearchId] = useState<string>("188659");

  useEffect(() => {
    loadMsgPackData("/content_lookup.msgpack", setContentLookup);
    loadMsgPackData("/people_lookup.msgpack", setAuthorLookup);
    [0, 1, 2, 3].forEach((i) =>
      loadMsgPackData(`/content_${i}.msgpack`, appendRelationshipLookup)
    );
    // loadMsgPackData("/content.msgpack", setRelationshipLookup);
  }, []);

  return (
    <Flex>
      {relationshipLookup && contentLookup && authorLookup ? (
        <div style={{ width: "30%" }}>
          <SearchBar data={contentLookup} setSearchId={setSearchId} defaultSearch={contentLookup[searchId].title} />
          <CircularSOM data={relationshipLookup.find((item) => item.id.toString() === searchId) || relationshipLookup[0]} contentLookup={contentLookup} />
        </div>
      ) : null}
    </Flex>
  );
};

export default Dashboard;
