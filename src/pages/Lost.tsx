import Wrapper from "../components/Wrapper";

export default function NotFound() {
  return (
    <Wrapper
      loading={false}
      header="404"
      subheader="The requested page doesn't exist"
    >
      <p>:(</p>
    </Wrapper>
  );
}
