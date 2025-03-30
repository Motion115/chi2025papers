import { Select } from "antd";
import { ContentLookupSpec } from "../types";


interface SearchBarProps {
  data: ContentLookupSpec;
  defaultSearch: string;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
}

interface SelectOption {
  value: string;
  label: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ data, defaultSearch, setSearchId }) => {
  // Properly format the options array
  const searchList: SelectOption[] = Object.values(data).map((content) => ({
    value: content.title,
    label: content.title,
  }));

  const onChange = (value: string) => {
    console.log(`selected ${value}`);
    // Find the corresponding content by title
    const selectedContent = Object.values(data).find(
      (content) => content.title === value
    );
    if (selectedContent) {
      // Assuming you want to set the ID of the selected content
      // You'll need to modify this if your data structure is different
      const contentId = Object.keys(data).find(
        (key) => data[key].title === value
      );
      console.log(contentId);
      if (contentId) {
        setSearchId(contentId);
      }
    }
  };

  // const onSearch = (value: string) => {
  //   console.log("search:", value);
  // };

  return (
    <Select
      showSearch
      placeholder="Search content"
      optionFilterProp="label"
      onChange={onChange}
      // onSearch={onSearch}
      filterOption={(input, option) =>
        (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
      }
      style={{ width: "100%" }}
      options={searchList}
      defaultValue={defaultSearch}
    />
  );
};

export default SearchBar;
