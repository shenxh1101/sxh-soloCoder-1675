export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/orders/index',
    'pages/repair/index',
    'pages/profile/index',
    'pages/order-detail/index',
    'pages/statistics/index',
    'pages/worker-select/index',
    'pages/rating/index',
    'pages/timeout/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1677FF',
    navigationBarTitleText: '物业报修管理',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F5F7FA'
  },
  tabBar: {
    color: '#6B7280',
    selectedColor: '#1677FF',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/orders/index',
        text: '工单'
      },
      {
        pagePath: 'pages/repair/index',
        text: '报修'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的'
      }
    ]
  }
})
