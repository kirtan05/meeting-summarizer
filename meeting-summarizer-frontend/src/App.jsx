import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  // DialogContentText, // No longer needed directly for summary
  DialogActions,
  Link,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
// --- Import Markdown Renderer ---
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// ------------------------------

// Basic Theme (Optional: Customize further)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    // Add typography adjustments if needed for Markdown
    // typography: {
    //   body1: { // Target <p> tags
    //      marginBottom: '1em',
    //   },
    //    h1: { ... },
    //    h2: { ... }, etc.
    // }
  },
});

// --- Configuration ---
const API_BASE_URL = 'https://1f1c-184-105-162-170.ngrok-free.app';
// ---------------------

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [textFile, setTextFile] = useState(null);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info',
  });

  const audioInputRef = useRef(null);
  const textInputRef = useRef(null);
  const handleCopySummary = async () => {
    if (!summary) return; // Don't copy if summary is empty

    if (!navigator.clipboard) {
      // Fallback for older browsers (less common now)
      // You could implement a textarea-based copy here if needed
      setNotification({ open: true, message: 'Clipboard API not available in this browser.', severity: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(summary);
      setNotification({ open: true, message: 'Summary copied to clipboard!', severity: 'success' });
    } catch (err) {
      console.error('Failed to copy summary: ', err);
      setNotification({ open: true, message: 'Failed to copy summary.', severity: 'error' });
    }
  };

  // --- Handler for Downloading Summary ---
  const handleDownloadSummary = () => {
    if (!summary) return; // Don't download if summary is empty

    // 1. Create a Blob from the summary text
    // Use text/markdown as MIME type since it's Markdown formatted
    const blob = new Blob([summary], { type: 'text/markdown;charset=utf-8' });

    // 2. Create an object URL for the Blob
    const url = URL.createObjectURL(blob);

    // 3. Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meeting_summary.md'; // Set desired filename with .md extension

    // 4. Append to body (required for Firefox), click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 5. Revoke the object URL to free up memory
    URL.revokeObjectURL(url);

    // Optional: Show notification
    setNotification({ open: true, message: 'Summary download started.', severity: 'info' });
  };
  const handleFileChange = (event, fileType) => {
    const file = event.target.files[0];
    if (file) {
      if (fileType === 'audio') {
        setAudioFile(file);
      } else {
        setTextFile(file);
      }
    }
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const clearInputs = (fileType) => {
     if (fileType === 'audio') {
        setAudioFile(null);
        if(audioInputRef.current) audioInputRef.current.value = '';
     } else if (fileType === 'text') {
        setTextFile(null);
        if(textInputRef.current) textInputRef.current.value = '';
     }
  }

  const handleSubmit = async (uploadType) => {
    const isAudio = uploadType === 'audio';
    const file = isAudio ? audioFile : textFile;
    const endpoint = isAudio ? '/upload/audio' : '/upload/text';

    if (!file) {
      setNotification({ open: true, message: `Please select a ${uploadType} file.`, severity: 'warning' });
      return;
    }

    setIsLoading(true);
    setSummary('');
    setNotification({ open: false, message: '', severity: 'info' });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email || "not_provided@example.com");

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
           'ngrok-skip-browser-warning': 'true'
        },
        // timeout: 300000,
      });

      if (response.data && response.data.message) {
         setSummary(response.data.message);
         setShowSummaryModal(true);
         setNotification({ open: true, message: 'Summary generated successfully!', severity: 'success' });
         clearInputs(uploadType);
      } else {
         console.error("Unexpected response format:", response.data);
         setNotification({ open: true, message: 'Received an unexpected response from the server.', severity: 'error' });
      }

    } catch (error) {
      console.error(`Error uploading ${uploadType} file:`, error);
      let errorMessage = `Failed to process ${uploadType} file.`;
       if (error.message === 'Network Error') {
           errorMessage = 'Network error: Cannot connect to the server. Please check the backend URL and your connection.';
       } else if (error.code === 'ECONNABORTED') {
           errorMessage = 'The request timed out. The server might be busy or the file is too large.';
       } else if (error.response) {
           errorMessage = `Server error: ${error.response.status} - ${error.response.data?.detail || error.response.statusText}`;
           console.error('Error Response Data:', error.response.data);
       } else if (error.request) {
           errorMessage = 'No response received from the server. It might be down or unreachable.';
       } else {
           errorMessage = `An unexpected error occurred: ${error.message}`;
       }
      setNotification({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };

  const handleCloseModal = () => {
    setShowSummaryModal(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Summarizer AI
          </Typography>
          <Tooltip title="View Source on GitHub">
             <IconButton
                color="inherit"
                href="https://github.com/kirtan05/meeting-summarizer/" // Your repo link
                target="_blank"
                rel="noopener noreferrer"
             >
                <GitHubIcon />
             </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4} justifyContent="center">
          {/* Audio Upload Card */}
          <Grid item xs={12} md={6}>
             <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
               <CardContent sx={{ flexGrow: 1 }}>
                 <Typography variant="h5" component="div" gutterBottom> Upload Audio </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}> Select an audio file (e.g., .wav, .mp3) of your meeting. </Typography>
                 <Button variant="contained" component="label" startIcon={<AudioFileIcon />} disabled={isLoading} fullWidth sx={{ mb: 1 }} >
                   Select Audio File
                   <input ref={audioInputRef} type="file" hidden accept="audio/*" onChange={(e) => handleFileChange(e, 'audio')} />
                 </Button>
                 {audioFile && (<Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', wordBreak: 'break-all' }}> Selected: {audioFile.name} </Typography>)}
                 {!audioFile && (<Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: 'calc(1.4375em + 8px)' }}> No audio file selected </Typography>)}
               </CardContent>
               <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0, mt: 'auto' }}>
                 <Button variant="contained" color="primary" onClick={() => handleSubmit('audio')} disabled={!audioFile || isLoading} endIcon={isLoading && <CircularProgress size={20} color="inherit" />} >
                   {isLoading ? 'Processing...' : 'Summarize Audio'}
                 </Button>
               </CardActions>
             </Card>
          </Grid>

          {/* Text Upload Card */}
          <Grid item xs={12} md={6}>
             <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
               <CardContent sx={{ flexGrow: 1 }}>
                 <Typography variant="h5" component="div" gutterBottom> Upload Transcript </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}> Select a plain text file (.txt) containing the meeting transcript. </Typography>
                 <Button variant="contained" component="label" startIcon={<UploadFileIcon />} disabled={isLoading} fullWidth sx={{ mb: 1 }} >
                   Select Text File
                   <input ref={textInputRef} type="file" hidden accept=".txt, text/plain" onChange={(e) => handleFileChange(e, 'text')} />
                 </Button>
                 {textFile && (<Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', wordBreak: 'break-all' }}> Selected: {textFile.name} </Typography>)}
                 {!textFile && (<Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: 'calc(1.4375em + 8px)' }}> No text file selected </Typography>)}
               </CardContent>
               <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0, mt: 'auto' }}>
                 <Button variant="contained" color="primary" onClick={() => handleSubmit('text')} disabled={!textFile || isLoading} endIcon={isLoading && <CircularProgress size={20} color="inherit" />} >
                   {isLoading ? 'Processing...' : 'Summarize Text'}
                 </Button>
               </CardActions>
             </Card>
          </Grid>

          {/* Email Input Field */}
          <Grid item xs={12}>
             <TextField fullWidth label="Email Address" variant="outlined" type="email" value={email} onChange={handleEmailChange} disabled={isLoading} helperText="Enter email for sending the Minutes of Meeting" sx={{ mt: 2 }} />
          </Grid>
        </Grid>

        {/* --- Summary Display Modal --- */}
        <Dialog
            open={showSummaryModal}
            onClose={handleCloseModal}
            scroll="paper"
            aria-labelledby="summary-dialog-title"
            aria-describedby="summary-dialog-description"
            maxWidth="md"
            fullWidth
        >
            <DialogTitle id="summary-dialog-title">
                Meeting Summary
                <IconButton aria-label="close" onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }} >
                  <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers={true}>
                 <Box
                    id="summary-dialog-description"
                    sx={{
                      py: 1,
                      maxHeight: '60vh',
                      overflowY: 'auto',
                      // --- Styling for Markdown (keep existing sx styles here) ---
                      '& h1': theme.typography.h4,
                      '& h2': theme.typography.h5,
                      '& h3': theme.typography.h6,
                      '& h4, & h5, & h6': theme.typography.subtitle1,
                      '& p': { ...theme.typography.body1, mb: 1.5 },
                      '& ul, & ol': { pl: 3, mb: 1.5 },
                      '& li': { mb: 0.5 },
                      '& code': {
                          backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.9em',
                          fontFamily: 'monospace',
                      },
                      '& pre': {
                           backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.200',
                           padding: theme.spacing(1.5),
                           borderRadius: '4px',
                           overflowX: 'auto',
                           fontFamily: 'monospace',
                           fontSize: '0.9em',
                       },
                      '& table': {
                          borderCollapse: 'collapse',
                          width: '100%',
                          mb: 1.5,
                       },
                      '& th, & td': {
                          border: `1px solid ${theme.palette.divider}`,
                          textAlign: 'left',
                          padding: theme.spacing(1),
                       },
                      '& th': {
                          fontWeight: 'bold',
                       },
                      '& blockquote': {
                          borderLeft: `4px solid ${theme.palette.divider}`,
                          pl: 2,
                          ml: 0,
                          fontStyle: 'italic',
                          color: theme.palette.text.secondary,
                       },
                      '& hr': {
                          border: 'none',
                          borderTop: `1px solid ${theme.palette.divider}`,
                          my: 2,
                       },
                      '& a': {
                          color: theme.palette.primary.main,
                          textDecoration: 'underline',
                       },
                      // --- End Markdown Styling ---
                    }}
                 >
                   <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {summary || "No summary generated."}
                   </ReactMarkdown>
                 </Box>
            </DialogContent>
            {/* --- Updated DialogActions --- */}
            <DialogActions sx={{ justifyContent: 'space-between', px: 3, py: 2 }}> {/* Add padding and space between */}
                 {/* Container for Copy and Download Buttons */}
                 <Box>
                     <Tooltip title="Copy summary to clipboard">
                         {/* Span needed for tooltip when button is disabled */}
                         <span>
                             <Button
                                 onClick={handleCopySummary}
                                 startIcon={<ContentCopyIcon />}
                                 disabled={!summary || isLoading} // Disable if no summary or loading
                                 sx={{ mr: 1 }} // Add margin right for spacing
                             >
                                 Copy
                             </Button>
                         </span>
                     </Tooltip>
                     <Tooltip title="Download summary as Markdown file">
                         {/* Span needed for tooltip when button is disabled */}
                         <span>
                             <Button
                                 onClick={handleDownloadSummary}
                                 startIcon={<DownloadIcon />}
                                 disabled={!summary || isLoading} // Disable if no summary or loading
                             >
                                 Download (.md)
                             </Button>
                         </span>
                     </Tooltip>
                 </Box>

                {/* Close Button */}
                <Button onClick={handleCloseModal} color="primary" variant="contained">
                    Close
                </Button>
            </DialogActions>
            {/* --------------------------- */}
        </Dialog>
        {/* ----------------------------- */}


        {/* Notification Snackbar */}
        <Snackbar open={notification.open} autoHideDuration={6000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled">
            {notification.message}
          </Alert>
        </Snackbar>

      </Container>

      {/* Footer Example */}
       <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '} {new Date().getFullYear()} {' Meeting Summarizer AI.'}
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;