#include <napi.h>
#include <math.h>

#pragma pack(push, 1)

struct xperf_quic_ack {
	unsigned int rtt;
	unsigned long long stamp;
};

#pragma pack(pop)

Napi::Value Deserialize(const Napi::CallbackInfo &info)
{
	Napi::Env env = info.Env();

	if (info.Length() != 1) {
		Napi::TypeError::New(env, "Wrong number of arguments")
			.ThrowAsJavaScriptException();
		return env.Null();
	}

	if (!info[0].IsBuffer()) {
		Napi::TypeError::New(env, "Invalid argument type")
			.ThrowAsJavaScriptException();
		return env.Null();
	}

	auto buffer = info[0].As<Napi::Buffer<unsigned char> >();

	if (buffer.Length() < sizeof(xperf_quic_ack)) {
		Napi::TypeError::New(env, "No enough buffer length")
			.ThrowAsJavaScriptException();
		return env.Null();
	}

	auto data = reinterpret_cast<xperf_quic_ack *>(buffer.Data());

	Napi::Object result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "stamp"),
		   Napi::Number::New(env, data->stamp / 1000));
	result.Set(Napi::String::New(env, "rtt"),
		   Napi::Number::New(env, data->rtt / 1000.0));

	return result;
}

Napi::Object Initialize(Napi::Env env, Napi::Object exports)
{
	exports.Set(Napi::String::New(env, "size"),
		    Napi::Number::New(env, sizeof(xperf_quic_ack)));
	exports.Set(Napi::String::New(env, "deserialize"),
		    Napi::Function::New(env, Deserialize));

	return exports;
}

NODE_API_MODULE(quic_ack, Initialize)
