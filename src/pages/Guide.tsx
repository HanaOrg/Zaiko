import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Accordion,
  AccordionItem,
} from "@heroui/react";
import Footer from "../components/Footer";
import Wrapper from "../components/Wrapper";

export default function Guide() {
  return (
    <Wrapper
      header="Guide"
      subheader="Some helpful information"
      loading={false}
    >
      <Accordion>
        <AccordionItem title="How do I export my inventory? How does it work?">
          <p>
            On the settings tab, you have a <b>Data exports</b> section from
            where you can export your inventory to JSON, XLSX, or CSV files.
            <br />
            If JSON is chosen, the file will look like this:
            <pre>
              <code>
                {`[
  {
    name: "Sample set one",
    items: [
      {
        name: "Sample item one",
        description: "...",
        (more properties here...)
      }
    ]
  }
]`}
              </code>
            </pre>
            <br />
            If XLSX (Microsoft Excel) format is chosen instead, a page in your
            spreadsheet will be made for each set, looking each one like this:
            <Table>
              <TableHeader>
                <TableColumn>Stock</TableColumn>
                <TableColumn>Name</TableColumn>
                <TableColumn>Description</TableColumn>
                <TableColumn>(other properties...)</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>100</TableCell>
                  <TableCell>Sample item 1</TableCell>
                  <TableCell>Sample description one</TableCell>
                  <TableCell>...</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>150</TableCell>
                  <TableCell>Sample item 2</TableCell>
                  <TableCell>Sample description two</TableCell>
                  <TableCell>...</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={4}>(and so on...)</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </p>
        </AccordionItem>
        <AccordionItem title="I changed the app's name but some places still use 'Zaiko'. Why?">
          Setting the app's name is only meant for customization, as you may be
          using Zaiko in a company and might want to use your company's name
          everywhere. Things like config files, copyright notices, etc... are{" "}
          <i>expected</i> to use "Zaiko" as the app's name.
        </AccordionItem>
      </Accordion>
      <Footer />
    </Wrapper>
  );
}
