{
  "targets": [
    {
      "target_name": "tcp_data",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "sources": [ "tcp_data.cc" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
    },
    {
      "target_name": "quic_data",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "sources": [ "quic_data.cc" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
    },
    {
      "target_name": "quic_ack",
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "sources": [ "quic_ack.cc" ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ],
    }
  ]
}
