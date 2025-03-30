import React from "react";
import { ConfigProvider, Layout, Typography } from "antd";
import Dashboard from "./Dashboard";
import THEME from "./style/theme";

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;

const App: React.FC = () => {
  return (
    <>
      <ConfigProvider theme={THEME}>
        <div>
          <Header>
            <Title level={1}>CHI 2025 Papers Explorer</Title>
          </Header>
          <Content>
            <Dashboard />
          </Content>
          <Footer>
            <Text type="secondary">© Ruishi (Ray) Zou 2025</Text>
          </Footer>
        </div>
      </ConfigProvider>
    </>
  );
}

export default App;
