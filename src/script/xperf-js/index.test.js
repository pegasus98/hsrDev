const {
	toBeDeepCloseTo,
	toMatchCloseTo,
} = require("jest-matcher-deep-close-to");
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

const xperf = require(".");

test("TCP_DATA backend", () => {
	const chunks = [];

	const deserializer = new xperf.Deserializer(xperf.TCP_DATA, (data) => {
		chunks.push(data);
	});

	deserializer.feed(
		Buffer.from([
			0x08, 0x05, 0x00, 0x00, 0x78, 0x1d, 0xdf, 0x2a, 0x16, 0xb3, 0x0d, 0x17,
		])
	);
	expect(chunks).toStrictEqual([]);

	deserializer.feed(
		Buffer.from([
			0xa2, 0x01, 0x00, 0x00, 0x1b, 0x5a, 0x00, 0x00, 0xfe, 0xcb, 0x01, 0x00,
		])
	);
	expect(chunks).toBeDeepCloseTo([
		{
			bltBw: 72.32299041748047, // bottleneck bandwidth (Mbps)
			cwnd: 0.538384, // congestion window (MiB)
			minRtt: 23.067, // minimum RTT (ms)
			stamp: 1661180745359, // UNIX timestamp (ms)
		},
	]);
});

test("QUIC_DATA backend", () => {
	const chunks = [];

	const deserializer = new xperf.Deserializer(xperf.QUIC_DATA, (data) => {
		chunks.push(data);
	});

	deserializer.feed(
		Buffer.from([
			0xa0, 0x00, 0x00, 0x00, 0x32, 0x7e, 0x4d, 0x7b, 0x49, 0xe7, 0x05, 0x00,
			0x7c, 0x86, 0xd5, 0x3a, 0x00, 0x00, 0x00, 0x00, 0x2e, 0x4f, 0x01, 0x00,
			0x00, 0x00, 0x00, 0x00, 0xa0, 0x00, 0x00, 0x00, 0x65, 0x80, 0x4d, 0x7b,
			0x49, 0xe7, 0x05, 0x00, 0x7c, 0x86, 0xd5, 0x3a, 0x00, 0x00, 0x00, 0x00,
			0x2e, 0x4f, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0xa0, 0x00, 0x00, 0x00,
			0x66, 0x82, 0x4d, 0x7b, 0x49, 0xe7, 0x05, 0x00, 0x7c, 0x86, 0xd5, 0x3a,
			0x00, 0x00, 0x00, 0x00, 0x2e, 0x4f, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00,
			0xa0, 0x00, 0x00, 0x00, 0x59, 0x84, 0x4d, 0x7b, 0x49, 0xe7, 0x05, 0x00,
		])
	);
	expect(chunks).toBeDeepCloseTo([
		{
			bltBw: 987.072124, // bottleneck bandwidth (Mbps)
			cwnd: 0.08183097839355469, // congestion window (MiB)
			minRtt: 0.16, // minimum RTT (ms)
			stamp: 1661677670858, // UNIX stamp (ms)
		},
		{
			bltBw: 987.072124, // bottleneck bandwidth (Mbps)
			cwnd: 0.08183097839355469, // congestion window (MiB)
			minRtt: 0.16, // minimum RTT (ms)
			stamp: 1661677670858, // UNIX stamp (ms)
		},
		{
			bltBw: 987.072124, // bottleneck bandwidth (Mbps)
			cwnd: 0.08183097839355469, // congestion window (MiB)
			minRtt: 0.16, // minimum RTT (ms)
			stamp: 1661677670859, // UNIX stamp (ms)
		},
	]);
});

test("QUIC_ACK backend", () => {
	const chunks = [];

	const deserializer = new xperf.Deserializer(xperf.QUIC_ACK, (data) => {
		chunks.push(data);
	});

	deserializer.feed(
		Buffer.from([
			0x86, 0x04, 0x00, 0x00, 0x2c, 0xee, 0x4e, 0x7b, 0x49, 0xe7, 0x05, 0x00,
		])
	);
	expect(chunks).toBeDeepCloseTo([
		{
			rtt: 1.158, // RTT (ms)
			stamp: 1661677670952, // UNIX stamp (ms)
		},
	]);
});
