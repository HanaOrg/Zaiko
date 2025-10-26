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
import Wrapper from "../components/Wrapper";

export default function Help() {
  return (
    <Wrapper header="Help" subheader="Some helpful information" loading={false}>
      <Accordion>
        <AccordionItem title="How do I export my inventory? How does it work?">
          <p>
            On the settings tab, you have an <b>Export your data</b> section
            from where you can export your inventory to JSON, XLSX, or CSV
            files.
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
      </Accordion>
    </Wrapper>
  );
}
