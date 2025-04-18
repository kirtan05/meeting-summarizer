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
  TextField, // Make sure TextField is imported
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
const API_BASE_URL = 'https://e9ed-184-105-162-170.ngrok-free.app'; // Or your deployed backend URL
// ---------------------

function App() {
  const [audioFile, setAudioFile] = useState(null);
  const [textFile, setTextFile] = useState(null);
  const [email, setEmail] = useState(''); // State for email input
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

  // Function to handle changes in the email input field
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
     } else { // clear all (might not be needed now)
        setAudioFile(null);
        setTextFile(null);
        // Keep email input value unless explicitly cleared
        // setEmail('');
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

    // Optional: Add stricter email validation if needed
    // if (!email || !/\S+@\S+\.\S+/.test(email)) {
    //    setNotification({ open: true, message: 'Please enter a valid email address.', severity: 'warning' });
    //    return;
    // }


    setIsLoading(true);
    setSummary('');
    setNotification({ open: false, message: '', severity: 'info' });

    const formData = new FormData();
    formData.append('file', file);
    // *** Include the email from state in the FormData ***
    formData.append('email', email || "not_provided@example.com"); // Use entered email or placeholder

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
           // Add ngrok skip browser warning header if using ngrok free tier
           'ngrok-skip-browser-warning': 'true'
        },
        // timeout: 300000, // 5 minutes timeout
      });

      if (response.data && response.data.message) {
         setSummary(response.data.message);
         setShowSummaryModal(true);
         setNotification({ open: true, message: 'Summary generated successfully!', severity: 'success' });
         clearInputs(uploadType);
         // Decide if you want to clear the email field too after success
         // setEmail('');
      } else {
         console.error("Unexpected response format:", response.data);
         setNotification({ open: true, message: 'Received an unexpected response from the server.', severity: 'error' });
      }

    } catch (error) {
      console.error(`Error uploading ${uploadType} file:`, error);
      let errorMessage = `Failed to process ${uploadType} file.`;
       // Improved error message handling
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
        {/* Wrap upload cards and email input in a parent Grid container */}
        <Grid container spacing={4} justifyContent="center">

          {/* Audio Upload Card */}
          <Grid item xs={12} md={6}>
            <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}> {/* Ensure cards have same height */}
              <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to grow */}
                <Typography variant="h5" component="div" gutterBottom>
                  Upload Audio
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select an audio file (e.g., .wav, .mp3) of your meeting.
                </Typography>
                <Button
                  variant="contained"
                  component="label"
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
                    accept="audio/*"
                    onChange={(e) => handleFileChange(e, 'audio')}
                  />
                </Button>
                {audioFile && (
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', wordBreak: 'break-all' }}> {/* Allow long filenames to wrap */}
                    Selected: {audioFile.name}
                  </Typography>
                )}
                 {!audioFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: 'calc(1.4375em + 8px)' }}> {/* Adjust height to roughly match line-height + margin */}
                        No audio file selected
                    </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0, mt: 'auto' }}> {/* Push actions to bottom */}
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
             <Card elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}> {/* Ensure cards have same height */}
              <CardContent sx={{ flexGrow: 1 }}> {/* Allow content to grow */}
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
                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', wordBreak: 'break-all' }}> {/* Allow long filenames to wrap */}
                    Selected: {textFile.name}
                  </Typography>
                 )}
                  {!textFile && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic', height: 'calc(1.4375em + 8px)' }}> {/* Adjust height to roughly match line-height + margin */}
                        No text file selected
                    </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', p: 2, pt: 0, mt: 'auto' }}> {/* Push actions to bottom */}
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

          {/* --- UNCOMMENTED EMAIL INPUT FIELD --- */}
          <Grid item xs={12}>
             <TextField
               fullWidth
               label="Email Address (Optional)"
               variant="outlined"
               type="email"
               value={email}
               onChange={handleEmailChange} // Make sure this handler is defined
               disabled={isLoading}
               helperText="Enter email (optional - backend feature for sending email might be disabled)." // Updated helper text
               sx={{ mt: 2 }} // Add some margin top for spacing
             />
          </Grid>
          {/* ------------------------------------- */}

        </Grid> {/* End of parent Grid container */}

        {/* Summary Display Modal */}
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
                <IconButton
                  aria-label="close"
                  onClick={handleCloseModal}
                  sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                  <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers={true}>
                 <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', p: 1, border: '1px solid #eee', borderRadius: '4px', background: '#f9f9f9', maxHeight: '60vh', overflowY: 'auto' }}> {/* Added max height and scroll */}
                   <DialogContentText
                       component="div" // Use div instead of p for better pre-wrap handling inside Box
                       id="summary-dialog-description"
                       tabIndex={-1}
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
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }} variant="filled"> {/* Use filled variant for better visibility */}
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