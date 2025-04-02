import { paragraphSpec, GistvisVisualizer } from "@gistvis/wsv";
import { useAuthorLookup } from "../store";
import { AuthorSpec } from "../types";

interface AuthorVisProps {
  authorList: AuthorSpec[];
}

const AuthorsVis: React.FC<AuthorVisProps> = ({ authorList }) => {
  console.log(authorList);

  const data: paragraphSpec[] = [
    {
      paragraphIdx: 0,
      paragraphContent: [
        {
          id: "p1s0",
          unitSegmentSpec: {
            insightType: "comparison",
            segmentIdx: 0,
            context: authorList.map((author) => {
              const affiliation = author.affiliations.map((aff) => aff.institution).join(" / ");
              return author.fullName + " (" + affiliation + ")";
            }).join(", "),
          },
          dataSpec: authorList.map((author) => {
            return {
              space: "the category of number of articles",
              breakdown: author.fullName,
              feature: "the proportion of number of articles",
              value: author.prevalence,
            }}
          ),
        },
      ],
    }
  ]


  return (
    <div>
      <GistvisVisualizer datafactSpec={data} />
    </div>
  );
};

export default AuthorsVis;
