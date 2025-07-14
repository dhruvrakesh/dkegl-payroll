
import { BATCH_STATUS, JOB_STATUS, EMAIL_STATUS, MESSAGE_TYPES } from './constants';

export const getStatusColor = (status: string) => {
  switch (status) {
    case BATCH_STATUS.DRAFT:
    case JOB_STATUS.PENDING:
    case EMAIL_STATUS.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case BATCH_STATUS.PROCESSING:
    case JOB_STATUS.PROCESSING:
    case EMAIL_STATUS.SENDING:
      return 'bg-blue-100 text-blue-800';
    case BATCH_STATUS.COMPLETED:
    case JOB_STATUS.COMPLETED:
    case EMAIL_STATUS.SENT:
      return 'bg-green-100 text-green-800';
    case BATCH_STATUS.ARCHIVED:
      return 'bg-gray-100 text-gray-800';
    case JOB_STATUS.FAILED:
    case EMAIL_STATUS.FAILED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getToastVariant = (messageType: string) => {
  switch (messageType) {
    case MESSAGE_TYPES.ERROR:
      return 'destructive';
    case MESSAGE_TYPES.SUCCESS:
      return 'default';
    case MESSAGE_TYPES.WARNING:
      return 'default';
    default:
      return 'default';
  }
};
