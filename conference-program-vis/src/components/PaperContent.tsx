import { AuthorLookupSpec, AuthorSpec, ContentLookupSpec, ShortAuthorsSpec } from "../types";
import AuthorsVis from "./Authors"
import { Layout, Typography } from "antd";

const { Title, Paragraph, Text, Link } = Typography;

interface PaperVisProps {
  paperId: string;
  contentLookup: ContentLookupSpec;
  authorLookup: AuthorLookupSpec;
}



const PaperContent: React.FC<PaperVisProps> = ({ paperId, contentLookup, authorLookup }) => {

  const title = contentLookup[paperId].title;
  const authors: AuthorSpec[] = contentLookup[paperId].authors.map((d: ShortAuthorsSpec) => {
    return authorLookup[d.personId]
  })
  console.log(authors)
  return (
    <Layout>
      <Text style={{ fontSize: 20, fontWeight: "bold"}}>{title}</Text>
      <Text type="secondary">
        * The bar chart shows how many papers the author produced in CHI'25.
      </Text>
      <AuthorsVis authorList={authors} />

      <Paragraph>
        <Text strong>Abstract:</Text> {contentLookup[paperId].abstract}
      </Paragraph>
    </Layout>
  );
}

export default PaperContent