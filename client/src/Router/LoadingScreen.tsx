import { Center } from '@components/containers';
import { CircularProgress } from '@mui/material';

const LoadingScreen = () => (
  <Center minHeight="100vh">
    <CircularProgress />
  </Center>
);

export default LoadingScreen;
