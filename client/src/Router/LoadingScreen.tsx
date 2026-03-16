import { Center } from '@components/containers';
import { CircularProgress } from '@mui/material';

const LoadingScreen = () => (
  <Center minHeight="100vh" bgcolor="background.default">
    <CircularProgress />
  </Center>
);

export default LoadingScreen;
