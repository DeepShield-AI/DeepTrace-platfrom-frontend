import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => ({
  tableCard: {
    background: 'white',
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    border: `1px solid ${token.colorBorderSecondary}`,
    overflow: 'hidden',
  },
  statusTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontWeight: 500,
    borderRadius: 12,
    padding: '2px 8px',
  },
  actionButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid',
    transition: 'all 0.3s',
    '&:hover': {
      transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  textIconButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 12px',
    borderRadius: 6,
    border: '1px solid',
    transition: 'all 0.3s',
    fontWeight: 500,
    fontSize: 13,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  },
  tableRow: {
    '&:hover': {
      background: 'rgba(24, 144, 255, 0.02) !important',
    },
  },
  expandContent: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderRadius: token.borderRadiusLG,
    margin: '0 0 8px 8px',
    border: `1px solid ${token.colorBorderSecondary}`,
  },
  searchBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    padding: 16,
    background: 'white',
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  emptyState: {
    padding: '48px 24px', 
    textAlign: 'center',
  },
  drawerFooter: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: '100%',
    borderTop: `1px solid ${token.colorBorderSecondary}`,
    padding: '16px 24px',
    background: '#fff',
    textAlign: 'right',
  },
  registerButton: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    color: 'white',
    fontWeight: 600,
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
    transition: 'all 0.3s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
      background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4090 100%)',
    },
  },
  formItem: {
    marginBottom: 20,
  },
  formLabel: {
    fontWeight: 600,
    color: token.colorTextHeading,
    marginBottom: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
  },
  requiredMark: {
    color: '#ff4d4f',
    marginLeft: 4,
  },
  inputLarge: {
    '& .ant-input, & .ant-input-number-input, & .ant-select-selector': {
      height: '44px !important',
      fontSize: '15px !important',
      padding: '8px 12px !important',
    },
    '& .ant-input:focus, & .ant-input-number-focused, & .ant-select-focused .ant-select-selector': {
      boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
    },
  },
  configSection: {
    marginBottom: 24,
    padding: 24,
    background: 'white',
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
    },
  },
  configSectionTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 20,
    color: token.colorTextHeading,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 16,
    borderBottom: `1px solid ${token.colorBorderTertiary}`,
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #f6f8fc 0%, #f0f2f5 100%)',
    borderBottom: `2px solid ${token.colorBorderSecondary}`,
  },
  tableCell: {
    fontSize: '13px !important',
    fontWeight: 400,
  },
  tableRowHover: {
    '&:hover': {
      '& td': {
        background: 'rgba(24, 144, 255, 0.04) !important',
      },
    },
  },
  actionCell: {
    '& .ant-space': {
      display: 'flex',
      gap: 6,
    },
  },
  compactProgress: {
    '& .ant-progress-inner': {
      width: '100% !important',
    },
  },
  // 新增配置表单样式
  configInput: {
    '& .ant-input': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  configSelect: {
    '& .ant-select-selector': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      '&:hover': {
        borderColor: '#722ed1',
      },
      '&.ant-select-focused': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  configNumber: {
    '& .ant-input-number': {
      borderRadius: token.borderRadiusMD,
      '&:hover': {
        borderColor: '#722ed1',
      },
      '&.ant-input-number-focused': {
        borderColor: '#722ed1',
        boxShadow: '0 0 0 2px rgba(114, 46, 209, 0.1)',
      },
    },
  },
  formHelpText: {
    fontSize: 12,
    color: token.colorTextSecondary,
    marginTop: 4,
    lineHeight: 1.4,
  },
  probeSelectContainer: {
    maxHeight: 240,
    overflow: 'auto',
    border: `1px solid ${token.colorBorderSecondary}`,
    borderRadius: token.borderRadiusMD,
    padding: 4,
    background: '#fafafa',
    '&::-webkit-scrollbar': {
      width: 6,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: token.colorBorderSecondary,
      borderRadius: 3,
    },
  },
  disabledInput: {
    '& .ant-input': {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
  },
  // 新增提示信息样式
  delayTip: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #fff7e6 0%, #fff1e6 100%)',
    border: '1px solid #ffd591',
    borderRadius: token.borderRadiusLG,
    marginBottom: 16,
  },
  delayTipIcon: {
    color: '#fa8c16',
    fontSize: 16,
    marginTop: 2,
  },
  delayTipContent: {
    flex: 1,
  },
  delayTipTitle: {
    fontWeight: 600,
    color: '#d46b08',
    marginBottom: 4,
    fontSize: 14,
  },
  delayTipText: {
    color: '#d46b08',
    fontSize: 13,
    lineHeight: 1.5,
  },
  // 新增操作确认框样式
  authFormItem: {
    marginBottom: 16,
  },
  authFormLabel: {
    fontWeight: 600,
    color: token.colorTextHeading,
    marginBottom: 8,
    fontSize: 14,
  },
  authInput: {
    '& .ant-input': {
      borderRadius: token.borderRadiusMD,
      border: `1px solid ${token.colorBorderSecondary}`,
      transition: 'all 0.2s',
      '&:focus': {
        borderColor: '#1890ff',
        boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
      },
    },
  },
  readOnlyField: {
    '& .ant-input': {
      backgroundColor: '#f5f5f5',
      color: '#666',
      cursor: 'not-allowed',
    },
  },
  // 新增错误相关样式
  errorAlert: {
    borderRadius: token.borderRadiusLG,
    marginBottom: 16,
    border: '1px solid #ffccc7',
  },
  errorDetail: {
    maxHeight: 120,
    overflow: 'auto',
    background: '#fff2f0',
    padding: 8,
    borderRadius: token.borderRadiusSM,
    border: '1px solid #ffccc7',
    fontSize: 12,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  errorTitle: {
    color: '#a8071a',
    fontWeight: 600,
  },
  retryButton: {
    borderColor: '#ff4d4f',
    color: '#ff4d4f',
    '&:hover': {
      borderColor: '#ff7875',
      color: '#ff7875',
      background: '#fff2f0',
    },
  },
  errorResult: {
    padding: '20px 0',
  },
  errorIcon: {
    color: '#ff4d4f',
    fontSize: 48,
    marginBottom: 16,
  },
}));
