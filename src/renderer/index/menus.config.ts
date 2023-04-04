export default [
    {
        name:'dataList',
        path:'/',
        level:0
    },
    {
        name: 'setting',
        icon: 'home',
        path: '/home',
        level:1,
    },

    {
        name: 'onlineData',
        level:1,
        path:'/statistics',
        // children: [
        //     {
        //         path: '/realtime/throughput',
        //         name: 'Throughput',
        //         level:1,
        //     },
        //     {
        //         path: '/realtime/snr',
        //         name: 'SNR',
        //         level:1,
        //     },
        //     {
        //         path: '/realtime/rsrp',
        //         name: 'RSRP',
        //         level:1,
        //     }
        // ]
    },
    // {
    //     icon: 'line-chart',
    //     name: '离线分析',
    //     path:'/analysis',
    //     level:1,
    // }, 
];