export default [
    {
        name:'数据列表',
        path:'/',
        level:0
    },
    {
        name: '实验设置',
        icon: 'home',
        path: '/home',
        level:1,
    },

    {
        icon: 'line-chart',
        name: '实时数据',
        level:1,
        path:'/statistics',
        // children: [
        //     {
        //         path: '/realtime/throughput',
        //         name: '吞吐量',
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