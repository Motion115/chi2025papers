import React, { useEffect, useState } from "react";
import {
  AuthorLookupSpec,
  AuthorSpec,
  ContentLookupSpec,
  ShortAuthorsSpec,
} from "../types";
import { searchArxiv } from "../utils/arXivSearch";
import AuthorsVis from "./Authors";
import { Button, Flex, Layout, Space, Tag, Tooltip, Typography } from "antd";
import {
  CalendarOutlined,
  ExclamationCircleOutlined,
  PaperClipOutlined,
  SearchOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { PaperTypeColorMap, PaperTypeMap } from "../utils/consts";

const { Title, Paragraph, Text, Link } = Typography;

export interface PaperVisProps {
  paperId: string;
  contentLookup: ContentLookupSpec;
  authorLookup: AuthorLookupSpec;
  trigger: number;
}

export type ArXivStatusType =
  | "didn't search"
  | "not found"
  | "found"
  | "searching";

const PaperContent: React.FC<PaperVisProps> = ({
  paperId,
  contentLookup,
  authorLookup,
  trigger
}) => {
  const title = contentLookup[paperId].title;
  const authors: AuthorSpec[] = contentLookup[paperId].authors.map(
    (d: ShortAuthorsSpec) => {
      return authorLookup[d.personId];
    }
  );

  const [arXivStatus, setArXivStatus] = useState("");
  const [arXivInfo, setArXivInfo] = useState<{
    title: string;
    link: string;
  }>({
    title: "",
    link: "",
  });

  const paperType = PaperTypeMap[contentLookup[paperId].trackId];
  const paperTypeColor = PaperTypeColorMap[contentLookup[paperId].trackId];

  const paperAward =
    contentLookup[paperId].award === "BEST_PAPER"
      ? "Best Paper"
      : contentLookup[paperId].award === "HONORABLE_MENTION"
      ? "Honorable Mention"
      : "";
  const paperAwardColor = paperAward === "Best Paper" ? "gold" : "orange";

  useEffect(() => {
    setArXivStatus("");
  }, [paperId]);

  const findArXiv = () => {
    setArXivStatus("searching");
    searchArxiv(`${title}`).then((response) => {
      if (response.entries.length === 0) {
        setArXivStatus("not found");
      } else {
        setArXivStatus("found");
        setArXivInfo({
          title: response.entries[0].title,
          link: response.entries[0].link,
        });
      }
    });
  };

  const openArXivPage = () => {
    window.open(arXivInfo.link, "_blank");
  };

  const ArXivButton = () => {
    if (arXivStatus === "searching") {
      return (
        <Button loading size="small">
          Searching ArXiv...
        </Button>
      );
    } else if (arXivStatus === "not found") {
      return (
        <Button disabled size="small">
          <ExclamationCircleOutlined />
          Preprint not found on ArXiv
        </Button>
      );
    } else if (arXivStatus === "found") {
      return (
        <Tooltip
          color="#001D70"
          title={
            <Paragraph style={{ color: "white" }}>
              The retrieved preprint may not be correct due to limitation in
              search term length of ArXiv API. The retrived paper title is{" "}
              <i>{arXivInfo.title}</i>
            </Paragraph>
          }
        >
          <Button onClick={openArXivPage} size="small">
            <PaperClipOutlined />
            Open ArXiv Preprint
          </Button>
        </Tooltip>
      );
    } else {
      return (
        <Button onClick={findArXiv} size="small">
          <SearchOutlined />
          Find ArXiv Preprint
        </Button>
      );
    }
  };

  const handlePlan = () => {
    const url = `https://programs.sigchi.org/chi/2025/program/content/${paperId}`;
    window.open(url, "_blank");
  };

  return (
    <Space direction="vertical" style={{width: "100%"}}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{title}</Text>
      <Flex gap="small" wrap>
        <Tag color={paperTypeColor}>{paperType}</Tag>
        {paperAward !== "" && (
          <Tag color={paperAwardColor}>
            <TrophyOutlined /> {paperAward}
          </Tag>
        )}
        <Button size="small" onClick={handlePlan}>
          <CalendarOutlined /> Plan in Programs
        </Button>
        <ArXivButton />
      </Flex>

      {/* <Text type="secondary">
        * The bar chart shows how many papers the author produced in CHI'25.
      </Text> */}
      <AuthorsVis authorList={authors} />

      <Paragraph style={{ textAlign: "justify"}}>
        <Text strong>Abstract:</Text> {contentLookup[paperId].abstract}
      </Paragraph>
    </Space>
  );
};

export default PaperContent;
