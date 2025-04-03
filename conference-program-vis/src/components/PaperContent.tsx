import React, { useEffect, useState } from "react";
import { AuthorLookupSpec, AuthorSpec, ContentLookupSpec, ShortAuthorsSpec } from "../types";
import { searchArxiv } from "../utils/arXivSearch";
import AuthorsVis from "./Authors"
import { Button, Layout, Tooltip, Typography } from "antd";
import { ExclamationCircleOutlined, PaperClipOutlined, SearchOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text, Link } = Typography;

export interface PaperVisProps {
  paperId: string;
  contentLookup: ContentLookupSpec;
  authorLookup: AuthorLookupSpec;
}

export type ArXivStatusType = "didn't search" | "not found" | "found" | "searching"

const PaperContent: React.FC<PaperVisProps> = ({ paperId, contentLookup, authorLookup }) => {
  const title = contentLookup[paperId].title;
  const authors: AuthorSpec[] = contentLookup[paperId].authors.map((d: ShortAuthorsSpec) => {
    return authorLookup[d.personId]
  })
  console.log(authors)

  const [arXivStatus, setArXivStatus] = useState("")
  const [arXivInfo, setArXivInfo] = useState<string>("")

  useEffect(() => {
    setArXivStatus("")
  }, [paperId])

  const findArXiv = () => {
    setArXivStatus("searching")
    searchArxiv(`${title}`).then((response) => {
      if (response.entries.length === 0) {
        setArXivStatus("not found")
      }
      else {
        setArXivStatus("found")
        setArXivInfo(response.entries[0].link
        );
      }
    })
  }

  const openArXivPage = () => {
    window.open(arXivInfo, "_blank")
  }

  const ArXivButton = () => {
    if (arXivStatus === "searching") {
      return <Button loading>Searching ArXiv...</Button>
    }
    else if (arXivStatus === "not found") {
      return (
        <Button disabled>
          <ExclamationCircleOutlined />
          Preprint not found on ArXiv
        </Button>
      );
    }
    else if (arXivStatus === "found") {
      return (
        <Tooltip title="The retrieved preprint may not be correct due to limitation in search term length of ArXiv API">
          <Button onClick={openArXivPage}>
            <PaperClipOutlined />
            Open ArXiv Preprint
          </Button>
        </Tooltip>
      );
    }
    else {
      return (
        <Button onClick={findArXiv}>
          <SearchOutlined />
          Find ArXiv Preprint
        </Button>
      );
    }
  }

  return (
    <Layout>
      <Text style={{ fontSize: 20, fontWeight: "bold"}}>{title}</Text>
      <ArXivButton />
      {/* <Text type="secondary">
        * The bar chart shows how many papers the author produced in CHI'25.
      </Text> */}
      <AuthorsVis authorList={authors} />

      <Paragraph>
        <Text strong>Abstract:</Text> {contentLookup[paperId].abstract}
      </Paragraph>
    </Layout>
  );
}

export default PaperContent