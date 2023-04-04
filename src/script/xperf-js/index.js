class Deserializer {
	constructor(backend, callback) {
		this.backend = backend;
		this.callback = callback;
		this.buffer = Buffer.alloc(0);
	}

	feed(buffer) {
		this.buffer = Buffer.concat([this.buffer, buffer]);
		let chunk = []
		while (this.buffer.length >= this.backend.size) {
			const deserialized = this.backend.deserialize(this.buffer);
			chunk.push(deserialized);
			this.buffer = this.buffer.slice(this.backend.size);
		}
		this.callback(chunk)
	}
}

module.exports.Deserializer = Deserializer;

// backends...
const bindings = require("bindings");
module.exports.TCP_DATA = bindings("tcp_data");
module.exports.QUIC_DATA = bindings("quic_data");
module.exports.QUIC_ACK = bindings("quic_ack");
