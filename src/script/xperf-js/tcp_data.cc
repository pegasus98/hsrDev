#include <napi.h>
#include <math.h>

#pragma pack(push, 1)

struct xperf_tcp_data {
	unsigned int mss_cache;
	unsigned long long stamp;
	unsigned int snd_cwnd;
	unsigned int min_rtt;
	unsigned int blt_bw;
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

	if (buffer.Length() < sizeof(xperf_tcp_data)) {
		Napi::TypeError::New(env, "No enough buffer length")
			.ThrowAsJavaScriptException();
		return env.Null();
	}

	auto data = reinterpret_cast<xperf_tcp_data *>(buffer.Data());

	Napi::Object result = Napi::Object::New(env);
	result.Set(Napi::String::New(env, "stamp"),
		   Napi::Number::New(env, data->stamp / 1000 / 1000));
	result.Set(Napi::String::New(env, "minRtt"),
		   Napi::Number::New(env, data->min_rtt / 1000.0));
	result.Set(Napi::String::New(env, "bltBw"),
		   Napi::Number::New(env, (unsigned long long)data->blt_bw *
						  data->mss_cache /
						  pow(2, 21)));
	result.Set(Napi::String::New(env, "cwnd"),
		   Napi::Number::New(env, (unsigned long long)data->snd_cwnd *
						  data->mss_cache / 1000.0 /
						  1000.0));

	return result;
}

Napi::Object Initialize(Napi::Env env, Napi::Object exports)
{
	exports.Set(Napi::String::New(env, "size"),
		    Napi::Number::New(env, sizeof(xperf_tcp_data)));
	exports.Set(Napi::String::New(env, "deserialize"),
		    Napi::Function::New(env, Deserialize));

	return exports;
}

NODE_API_MODULE(tcp_data, Initialize)
