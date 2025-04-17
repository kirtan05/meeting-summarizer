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
  DialogContentText,
  DialogActions,
  Link,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import CloseIcon from '@mui/icons-material/Close';
import GitHubIcon from '@mui/icons-material/GitHub'; // Example icon

// Basic Theme (Optional: Customize further)
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Example primary color
    },
    secondary: {
      main: '#dc004e', // Example secondary color
    },
  },
});

// --- Configuration ---
// IMPORTANT: Replace with your actual backend URL
const API_BASE_URL = 'http://localhost:8000'; // Or your deployed backend URL
// ---------------------

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [textFile, setTextFile] = useState(null);
  const [email, setEmail] = useState(''); // Kept for consistency, though email sending is off
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info', // 'success' | 'error' | 'warning' | 'info'
  });

  // Refs for clearing file inputs
  const audioInputRef = useRef(null);
  const textInputRef = useRef(null);

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
     } else { // clear all
        setAudioFile(null);
        setTextFile(null);
        setEmail('');
        if(audioInputRef.current) audioInputRef.current.value = '';
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
    // Basic email validation (optional)
    // if (!email || !/\S+@\S+\.\S+/.test(email)) {
    //   setNotification({ open: true, message: 'Please enter a valid email address.', severity: 'warning' });
    //   return;
    // }

    setIsLoading(true);
    setSummary(''); // Clear previous summary
    setNotification({ open: false, message: '', severity: 'info' }); // Close previous notifications

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email || "not_provided@example.com"); // Send placeholder if empty

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        // Optional: Add timeout
        // timeout: 300000, // 5 minutes timeout for potentially long processing
      });

      // Assuming backend returns { message: "summary_content" } for both endpoints
      if (response.data && response.data.message) {
         setSummary(response.data.message);
         setShowSummaryModal(true);
         setNotification({ open: true, message: 'Summary generated successfully!', severity: 'success' });
         clearInputs(uploadType); // Clear the specific input on success
      } else {
         // Handle cases where the response format is unexpected
         console.error("Unexpected response format:", response.data);
         setNotification({ open: true, message: 'Received an unexpected response from the server.', severity: 'error' });
      }

    } catch (error) {
      console.error(`Error uploading ${uploadType} file:`, error);
      let errorMessage = `Failed to process ${uploadType} file.`;
      if (error.response) {
        // Server responded with a status code outside 2xx range
        errorMessage = error.response.data?.detail || error.response.statusText || errorMessage;
         console.error('Error Response Data:', error.response.data);
         console.error('Error Response Status:', error.response.status);
      } else if (error.request) {
        // Request was made but no response received (network error, backend down)
        errorMessage = 'Network error or server is not responding.';
         console.error('Error Request:', error.request);
      } else {
        // Something happened in setting up the request
        errorMessage = `Error: ${error.message}`;
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
    // Optionally clear summary when modal closes
    // setSummary('');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Summarizer AI
          </Typography>
          {/* Example: Add a link to your GitHub repo */}
          <Tooltip title="View Source on GitHub (Example)">
             <IconButton
                color="inherit"
                href="https://github.com/your-username/your-repo" // Replace with your actual repo link
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
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Upload Audio
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select an audio file (e.g., .wav, .mp3) of your meeting.
                </Typography>
                <Button
                  variant="contained"
                  component="label" // Makes the button act like a label for the hidden input
                  startIcon={<AudioFileIcon />}
                  disabled={isLoading}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Select Audio File
                  <input
                    ref={audioInputRef}
                    type="file"
                    hidden
                    accept="audio/*" // Be more specific if needed: "audio/wav, audio/mpeg"
                    onChange={(e) => handleFileChange(e, 'audio')}
                  />
                </Button>
                {audioFile && (
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    Selected: {audioFile.name}
                  </Typography>
                )}
                 {!audioFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: '1.4375em' }}>
                        No audio file selected
                    </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit('audio')}
                  disabled={!audioFile || isLoading}
                  endIcon={isLoading && <CircularProgress size={20} color="inherit" />}
                >
                  {isLoading ? 'Processing...' : 'Summarize Audio'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

          {/* Text Upload Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Upload Transcript
                </Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                   Select a plain text file (.txt) containing the meeting transcript.
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  disabled={isLoading}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Select Text File
                  <input
                     ref={textInputRef}
                    type="file"
                    hidden
                    accept=".txt, text/plain"
                    onChange={(e) => handleFileChange(e, 'text')}
                  />
                </Button>
                 {textFile && (
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                    Selected: {textFile.name}
                  </Typography>
                 )}
                  {!textFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: '1.4375em' }}>
                        No text file selected
                    </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleSubmit('text')}
                  disabled={!textFile || isLoading}
                  endIcon={isLoading && <CircularProgress size={20} color="inherit" />}
                >
                   {isLoading ? 'Processing...' : 'Summarize Text'}
                </Button>
              </CardActions>
            </Card>
          </Grid>

           {/* Optional Email Input - Keep if you might re-enable email */}
           {/* <Grid item xs={12}>
             <TextField
               fullWidth
               label="Email Address (Optional)"
               variant="outlined"
               type="email"
               value={email}
               onChange={handleEmailChange}
               disabled={isLoading}
               helperText="Enter your email if you want results sent (feature currently disabled)."
             />
           </Grid> */}

        </Grid>

        {/* Summary Display Modal */}
        <Dialog
            open={showSummaryModal}
            onClose={handleCloseModal}
            scroll="paper" // Allows content scrolling
            aria-labelledby="summary-dialog-title"
            aria-describedby="summary-dialog-description"
            maxWidth="md" // Adjust as needed
            fullWidth // Takes up modal max width
        >
            <DialogTitle id="summary-dialog-title">
                Meeting Summary
                <IconButton
                  aria-label="close"
                  onClick={handleCloseModal}
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: (theme) => theme.palette.grey[500],
                  }}
                >
                  <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers={true}> {/* Adds dividers */}
                 {/* Use Box with whiteSpace for preserving formatting */}
                 <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', p: 1, border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9' }}>
                   <DialogContentText
                       id="summary-dialog-description"
                       tabIndex={-1} // For accessibility
                   >
                      {summary || "No summary generated."}
                   </DialogContentText>
                 </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseModal} color="primary" variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000} // Hide after 6 seconds
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} // Position
        >
          {/* Severity prop controls the color */}
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>

      </Container>

      {/* Footer Example */}
       <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Meeting Summarizer AI. '}
             {/* Add more footer info if needed */}
             {/* <Link color="inherit" href="#">
               Privacy Policy
             </Link> */}
          </Typography>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;