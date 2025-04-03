
export interface ArxivEntry {
  id: string;
  title: string;
  authors: string[];
  link: string;
}

export interface ArxivResponse {
  entries: ArxivEntry[];
  totalResults: number;
  startIndex: number;
}

export async function searchArxiv(query: string): Promise<ArxivResponse> {
  console.log(query);
  const cleanQuery = query.replace(/[<>"{}|\\^`]/g, "").trim();
  const firstFiveWords = cleanQuery.split(" ").slice(0, 3).join(" ");
  const baseUrl = "https://export.arxiv.org/api/query";
  const searchQuery = `ti:"${encodeURIComponent(firstFiveWords)}"`;
  const params = new URLSearchParams({
    search_query: searchQuery,
    start: "0",
    max_results: "1",
    sortBy: "submittedDate",
    sortOrder: "descending",
  });

  const url = `${baseUrl}?${params.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    const entries = Array.from(xmlDoc.querySelectorAll("entry")).map(
      (entry) => {
        return {
          id: entry.querySelector("id")?.textContent || "",
          title: entry.querySelector("title")?.textContent?.trim() || "",
          authors: Array.from(entry.querySelectorAll("author name")).map(
            (author) => author.textContent || ""
          ),
          link:
            entry
              .querySelector("link[rel='alternate'][type='text/html']")
              ?.getAttribute("href") || "",
        };
      }
    );

    const totalResults = parseInt(
      xmlDoc.querySelector("opensearch\\:totalResults")?.textContent || "0",
      1
    );

    return {
      entries,
      totalResults,
      startIndex: 0,
    };
  } catch (error) {
    console.error("Error fetching from arXiv API:", error);
    throw error;
  }
}
