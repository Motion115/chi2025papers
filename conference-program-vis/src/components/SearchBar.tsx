import { Flex, Select, Typography } from "antd";
import { ContentLookupSpec } from "../types";

const { Text } = Typography;

interface SearchBarProps {
  data: ContentLookupSpec;
  defaultSearch: string;
  setSearchId: React.Dispatch<React.SetStateAction<string>>;
}

interface SelectOption {
  value: string;
  label: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  data,
  defaultSearch,
  setSearchId,
}) => {
  const searchList: SelectOption[] = Object.entries(data).map(
    ([id, content]) => ({
      value: id,
      label: content.title,
    })
  );

  const onChange = (value: string) => {
    setSearchId(value);
    console.log(`selected ${value}`);
  };

  // const onSearch = (value: string) => {
  //   console.log("search:", value);
  // };

  return (
    <Flex>
      <Text style={{ fontWeight: "bold" }}>Seed paper: </Text>
      <Select
        showSearch
        placeholder="Search content"
        optionFilterProp="label"
        onChange={onChange}
        // onSearch={onSearch}
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: "100%", height: "3rem" }}
        options={searchList}
        defaultValue={defaultSearch}
      />
    </Flex>
  );
};

export default SearchBar;
