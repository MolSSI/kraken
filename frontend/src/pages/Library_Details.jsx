import { useEffect, useState, useContext } from 'react';

import {
    Container, 
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';

import ReactMarkdown from 'react-markdown';

// use rehype-raw to render HTML inside markdown
// https://stackoverflow.com/questions/70548725/any-way-to-render-html-in-react-markdown
// use remarkGfm to render markdown tables (gfm = GitHub Flavored Markdown)
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';


const MarkdownPage =({ markdown_file }) => {
    const [content, setContent] = useState("");

    useEffect(() => {
        fetch(markdown_file)
          .then((response) => response.text())
          .then((text) => {
            setContent(text);
          });
      }, [markdown_file]);

      const renderers = {
        h1: ({ children }) => <Typography variant="h2">{children}</Typography>,
        h2: ({ children }) => <Typography variant="h5" sx={{ fontStyle: "oblique", marginBottom: "15px", marginTop:"15px" }}>{children}</Typography>,
        table: ({ children }) => <Table>{children}</Table>,
        thead: ({ children }) => <TableHead>{children}</TableHead>,
        tbody: ({ children }) => <TableBody>{children}</TableBody>,
        tr: ({ children }) => <TableRow>{children}</TableRow>,
        th: ({ children, align }) => <TableCell align={align || 'inherit'}>{children}</TableCell>,
        td: ({ children, align }) => <TableCell align={align || 'inherit'}>{children}</TableCell>
      };
      

    return  (
    <Container maxWidth="xl" sx={{marginBottom: "30px"}}>
        <ReactMarkdown rehypePlugins={[rehypeRaw, remarkGfm]} components={renderers} > 
            {content}
        </ReactMarkdown>
    </Container>
    )

}

const Library_Details = () => {
    return (
        <MarkdownPage markdown_file={`/${document.location.pathname.split('/')[1]}/content/library_details.md`} />
    );
};


export default Library_Details;