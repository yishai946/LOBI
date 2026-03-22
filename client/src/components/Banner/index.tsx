import { Button, Typography } from '@mui/material';
import BannerSkeleton from '@skeletons/BannerSkeleton';
import { BannerContainer } from './BannerContainer';
import { Column, Row } from '@components/containers';

interface BannerProps {
  title: string;
  subtitle?: string;
  caption?: string;
  isLoading?: boolean;
  onButtonClick?: () => void;
  buttonLabel?: string;
  isActionLoading?: boolean;
}

const Banner = ({
  title,
  subtitle,
  caption,
  isLoading,
  onButtonClick,
  buttonLabel,
  isActionLoading,
}: BannerProps) =>
  isLoading ? (
    <BannerSkeleton />
  ) : (
    <BannerContainer>
      <Row justifyContent="space-between" alignItems="flex-end">
        <Column>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: subtitle ? 1 : 0,
              color: 'text.primary',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              sx={{
                opacity: 0.75,
                fontStyle: 'italic',
                color: 'text.primary',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {subtitle}
            </Typography>
          )}
          {caption && (
            <Typography
              variant="caption"
              sx={{
                mt: 0.5,
                color: 'text.secondary',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {caption}
            </Typography>
          )}
        </Column>
        {onButtonClick && buttonLabel && (
          <Button variant="contained" onClick={onButtonClick} disabled={isActionLoading}>
            {isActionLoading ? 'טוען...' : buttonLabel}
          </Button>
        )}
      </Row>
    </BannerContainer>
  );

export default Banner;
