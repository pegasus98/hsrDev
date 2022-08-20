#!/usr/bin/env python
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import SocketServer
import base64
import urllib
import sys
import os
import json
import time
os.environ['CUDA_VISIBLE_DEVICES']=''

import numpy as np
import time
import itertools

################## ROBUST MPC ###################

S_INFO = 5  # bit_rate, buffer_size, rebuffering_time, bandwidth_measurement, chunk_til_video_end
S_LEN = 8  # take how many frames in the past
MPC_FUTURE_CHUNK_COUNT = 3
VIDEO_BIT_RATE = [1500,4000,7500,12000,24000,60000,110000,160000]  # Kbps
# BITRATE_REWARD = [1, 2, 3, 5, 7, 10, 15, 20]
# BITRATE_REWARD_MAP = {0: 0, 1500: 1, 4000: 2, 7500: 3, 12000: 5, 24000: 7, 60000: 10, 110000: 15, 160000: 20}
M_IN_K = 1000.0
BUFFER_NORM_FACTOR = 10.0
CHUNK_TIL_VIDEO_END_CAP = 48.0
TOTAL_VIDEO_CHUNKS = 61
DEFAULT_QUALITY = 0  # default video quality without agent
REBUF_PENALTY = 800  # 1 sec rebuffering -> this number of Mbps
SMOOTH_PENALTY = 1
# TRAIN_SEQ_LEN = 100  # take as a train batch
# MODEL_SAVE_INTERVAL = 100
RANDOM_SEED = 42
# RAND_RANGE = 1000
SUMMARY_DIR = './results'
LOG_FILE = './results/log'
# in format of time_stamp bit_rate buffer_size rebuffer_time video_chunk_size download_time reward
NN_MODEL = None

CHUNK_COMBO_OPTIONS = []

# past errors in bandwidth
past_errors = []
past_bandwidth_ests = []

# video chunk sizes
size_video0 = [152105, 164687, 88452, 141940, 209616, 202276, 272352, 300974, 273780, 230390, 225329, 149292, 113074, 234067, 235922, 234347, 167434, 111158, 128086, 134853, 133028, 161883, 175081, 246394, 378145, 300761, 262691, 130430, 172458, 272885, 170398, 217124, 194318, 215818, 266241, 213130, 203420, 174208, 189967, 201334, 179799, 146948, 128602, 96493, 145450, 715098, 553989, 137621, 78809, 86370, 109959, 121002, 119215, 133770, 121050, 159003, 209212, 241240, 217494, 187582, ]
size_video1 = [436554, 434213, 213330, 367925, 526861, 545367, 702205, 761613, 700385, 613900, 612391, 393647, 301541, 629216, 638486, 632353, 449618, 289841, 346116, 353487, 369660, 429388, 454236, 630969, 939448, 788822, 694423, 356274, 475666, 766328, 463061, 498250, 494739, 517048, 647389, 553465, 522367, 461574, 554190, 570439, 490526, 389082, 356665, 287543, 395459, 1840043, 1569805, 400221, 239221, 243829, 297972, 340647, 335049, 355880, 321778, 457832, 600840, 691773, 598638, 525932, ]
size_video2 = [876299, 797614, 395402, 652459, 925018, 971217, 1341949, 1378627, 1294088, 1137316, 1147254, 746698, 569192, 1164815, 1188895, 1185332, 831419, 551622, 641064, 658598, 706619, 811354, 882190, 1267394, 1706245, 1451250, 1304536, 687010, 911555, 1421326, 874851, 865077, 913416, 938333, 1157098, 1033909, 901883, 863120, 1108438, 1110547, 943787, 758468, 679594, 552184, 753936, 3326766, 2913480, 786526, 489618, 483651, 595012, 672365, 654709, 714128, 643445, 872383, 1139493, 1309621, 1153367, 1013277, ]
size_video3 = [1473643, 1231911, 593937, 944150, 1444312, 1552294, 2062669, 2338133, 2125840, 1868409, 1862514, 1181571, 845598, 1842217, 1898627, 1896319, 1324786, 864845, 1054900, 1031299, 1059205, 1266805, 1352728, 1949725, 2660642, 2293032, 2023745, 1127478, 1445795, 2192863, 1429130, 1381996, 1451907, 1477892, 1853880, 1598907, 1427089, 1342701, 1806093, 1785896, 1555982, 1282935, 1175764, 946393, 1238888, 5141018, 4556799, 1308611, 838039, 825236, 990451, 1135499, 1142009, 1188257, 1088950, 1398542, 1867679, 2128905, 1886964, 1664312, ]
size_video4 = [3108467, 2444243, 1206058, 2043411, 2923307, 3091032, 3973274, 4687569, 4237579, 3675753, 3642407, 2266541, 1688508, 3698641, 3787291, 3771820, 2641054, 1765137, 2107701, 2127367, 2139256, 2583790, 2839377, 3851448, 5186632, 4510055, 3994481, 2208214, 2879434, 4297590, 2789151, 2727924, 2892511, 2909923, 3647285, 3161702, 2840583, 2693174, 3974774, 3792435, 3204408, 2594080, 2285375, 1859054, 2419026, 9426268, 8406769, 2580345, 1763494, 1684631, 2155458, 2309283, 2243731, 2363672, 2284874, 2813352, 3601459, 4148839, 3724616, 3300152, ]
size_video5 = [8180043, 6051763, 2571847, 5158500, 8340485, 8231554, 8784410, 12517109, 10991490, 9326896, 8965124, 5067802, 3249775, 9649338, 9737391, 9564716, 6535967, 4327284, 4939005, 4768288, 5411204, 5562789, 6394289, 9543562, 11885799, 9878547, 9496773, 5502215, 7202932, 9690277, 7524297, 7386225, 7835770, 7725043, 8752021, 8245135, 7595789, 7220101, 9145715, 9076620, 8274755, 6734139, 6180639, 4569329, 5876049, 22302415, 20345780, 6188981, 4305476, 4370391, 4784509, 5445198, 5777665, 5876532, 5224279, 7309161, 9398328, 10754460, 9736183, 8353873, ]
size_video6 = [15129740, 11364320, 4900312, 10004323, 18029957, 15917992, 14476642, 22674369, 19590032, 16584916, 15805818, 8418562, 5419593, 18906532, 18297166, 17526729, 11684538, 7833320, 9111577, 8711282, 10167397, 10137834, 11412707, 17225820, 21169642, 17537518, 17036471, 10337983, 13655531, 16920249, 14373216, 14512828, 14825359, 14467135, 15542831, 15167418, 14308759, 13405273, 15867541, 15996348, 14747618, 11811670, 11157266, 8809100, 10599745, 36448327, 34334703, 10850009, 7672047, 8022519, 8650785, 10192510, 11087488, 10514369, 8566539, 14134242, 17382855, 19476945, 17910721, 15040984, ]
size_video7 = [22495849, 16832468, 6913037, 13673953, 28065373, 24039914, 20060085, 33424044, 28750496, 24167252, 22633183, 11439124, 7418790, 29172306, 27206095, 25549317, 16787547, 11356668, 13021680, 12012191, 14662988, 14237319, 15912757, 24499357, 29879291, 24785014, 24544450, 15034455, 20275027, 23892978, 21282428, 21769626, 22222171, 21110353, 22175473, 22412357, 21360940, 19840546, 22888135, 23224859, 21524579, 17048015, 16120836, 12752639, 15012136, 49069897, 47080759, 15601287, 11213852, 11987620, 12792132, 15147658, 16959045, 15302384, 11465020, 21509321, 25719905, 28513510, 26536832, 21883769, ]

def get_chunk_size(quality, index):
    if ( index < 0 or index >= 60 ):
        return 0
    # note that the quality and video labels are inverted (i.e., quality 8 is highest and this pertains to video1)
    sizes = {7: size_video7[index], 6: size_video6[index], 5: size_video5[index], 4: size_video4[index], 3: size_video3[index], 2: size_video2[index], 1: size_video1[index], 0: size_video0[index]}
    return sizes[quality]

def make_request_handler(input_dict):

    class Request_Handler(BaseHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            self.input_dict = input_dict
            self.log_file = input_dict['log_file']
            #self.saver = input_dict['saver']
            self.s_batch = input_dict['s_batch']
            #self.a_batch = input_dict['a_batch']
            #self.r_batch = input_dict['r_batch']
            BaseHTTPRequestHandler.__init__(self, *args, **kwargs)

        def do_POST(self):
            content_length = int(self.headers['Content-Length'])
            post_data = json.loads(self.rfile.read(content_length))
            print post_data

            if ( 'pastThroughput' in post_data ):
                # @Hongzi: this is just the summary of throughput/quality at the end of the load
                # so we don't want to use this information to send back a new quality
                print "Summary: ", post_data
            else:
                # option 1. reward for just quality
                # reward = post_data['lastquality']
                # option 2. combine reward for quality and rebuffer time
                #           tune up the knob on rebuf to prevent it more
                # reward = post_data['lastquality'] - 0.1 * (post_data['RebufferTime'] - self.input_dict['last_total_rebuf'])
                # option 3. give a fixed penalty if video is stalled
                #           this can reduce the variance in reward signal
                # reward = post_data['lastquality'] - 10 * ((post_data['RebufferTime'] - self.input_dict['last_total_rebuf']) > 0)

                # option 4. use the metric in SIGCOMM MPC paper
                rebuffer_time = float(post_data['RebufferTime'] -self.input_dict['last_total_rebuf'])

                # --linear reward--
                reward = VIDEO_BIT_RATE[post_data['lastquality']] / M_IN_K \
                        - REBUF_PENALTY * rebuffer_time / M_IN_K \
                        - SMOOTH_PENALTY * np.abs(VIDEO_BIT_RATE[post_data['lastquality']] -
                                                  self.input_dict['last_bit_rate']) / M_IN_K

                # --log reward--
                # log_bit_rate = np.log(VIDEO_BIT_RATE[post_data['lastquality']] / float(VIDEO_BIT_RATE[0]))   
                # log_last_bit_rate = np.log(self.input_dict['last_bit_rate'] / float(VIDEO_BIT_RATE[0]))

                # reward = log_bit_rate \
                #          - 4.3 * rebuffer_time / M_IN_K \
                #          - SMOOTH_PENALTY * np.abs(log_bit_rate - log_last_bit_rate)

                # --hd reward--
                # reward = BITRATE_REWARD[post_data['lastquality']] \
                #         - 8 * rebuffer_time / M_IN_K - np.abs(BITRATE_REWARD[post_data['lastquality']] - BITRATE_REWARD_MAP[self.input_dict['last_bit_rate']])

                self.input_dict['last_bit_rate'] = VIDEO_BIT_RATE[post_data['lastquality']]
                self.input_dict['last_total_rebuf'] = post_data['RebufferTime']

                # retrieve previous state
                if len(self.s_batch) == 0:
                    state = [np.zeros((S_INFO, S_LEN))]
                else:
                    state = np.array(self.s_batch[-1], copy=True)

                # compute bandwidth measurement
                video_chunk_fetch_time = post_data['lastChunkFinishTime'] - post_data['lastChunkStartTime']
                video_chunk_size = post_data['lastChunkSize']

                # compute number of video chunks left
                video_chunk_remain = TOTAL_VIDEO_CHUNKS - self.input_dict['video_chunk_coount']
                self.input_dict['video_chunk_coount'] += 1

                # dequeue history record
                state = np.roll(state, -1, axis=1)

                # this should be S_INFO number of terms
                try:
                    state[0, -1] = VIDEO_BIT_RATE[post_data['lastquality']] / float(np.max(VIDEO_BIT_RATE))
                    state[1, -1] = post_data['buffer'] / BUFFER_NORM_FACTOR
                    state[2, -1] = rebuffer_time / M_IN_K
                    state[3, -1] = float(video_chunk_size) / float(video_chunk_fetch_time) / M_IN_K  # kilo byte / ms
                    state[4, -1] = np.minimum(video_chunk_remain, CHUNK_TIL_VIDEO_END_CAP) / float(CHUNK_TIL_VIDEO_END_CAP)
                    curr_error = 0 # defualt assumes that this is the first request so error is 0 since we have never predicted bandwidth
                    if ( len(past_bandwidth_ests) > 0 ):
                        curr_error  = abs(past_bandwidth_ests[-1]-state[3,-1])/float(state[3,-1])
                    past_errors.append(curr_error)
                except ZeroDivisionError:
                    # this should occur VERY rarely (1 out of 3000), should be a dash issue
                    # in this case we ignore the observation and roll back to an eariler one
                    past_errors.append(0)
                    if len(self.s_batch) == 0:
                        state = [np.zeros((S_INFO, S_LEN))]
                    else:
                        state = np.array(self.s_batch[-1], copy=True)

                # log wall_time, bit_rate, buffer_size, rebuffer_time, video_chunk_size, download_time, reward
                self.log_file.write(str(time.time()) + '\t' +
                                    str(VIDEO_BIT_RATE[post_data['lastquality']]) + '\t' +
                                    str(post_data['buffer']) + '\t' +
                                    str(rebuffer_time / M_IN_K) + '\t' +
                                    str(video_chunk_size) + '\t' +
                                    str(video_chunk_fetch_time) + '\t' +
                                    str(reward) + '\n')
                self.log_file.flush()

                # pick bitrate according to MPC           
                # first get harmonic mean of last 5 bandwidths
                past_bandwidths = state[3,-5:]
                while past_bandwidths[0] == 0.0:
                    past_bandwidths = past_bandwidths[1:]
                #if ( len(state) < 5 ):
                #    past_bandwidths = state[3,-len(state):]
                #else:
                #    past_bandwidths = state[3,-5:]
                bandwidth_sum = 0
                for past_val in past_bandwidths:
                    bandwidth_sum += (1/float(past_val))
                harmonic_bandwidth = 1.0/(bandwidth_sum/len(past_bandwidths))

                # future bandwidth prediction
                # divide by 1 + max of last 5 (or up to 5) errors
                max_error = 0
                error_pos = -5
                if ( len(past_errors) < 5 ):
                    error_pos = -len(past_errors)
                max_error = float(max(past_errors[error_pos:]))
                future_bandwidth = harmonic_bandwidth/(1+max_error)
                past_bandwidth_ests.append(harmonic_bandwidth)

		print(future_bandwidth)

                # future chunks length (try 4 if that many remaining)
                last_index = int(post_data['lastRequest'])
                future_chunk_length = MPC_FUTURE_CHUNK_COUNT
                if ( TOTAL_VIDEO_CHUNKS - last_index < 3 ):
                    future_chunk_length = TOTAL_VIDEO_CHUNKS - last_index

                # all possible combinations of 5 chunk bitrates (9^5 options)
                # iterate over list and for each, compute reward and store max reward combination
                max_reward = -1e100
                best_combo = ()
                start_buffer = float(post_data['buffer'])
                start_buffer = max(start_buffer - 0.3, 0.0)
                start = time.time()
                for full_combo in CHUNK_COMBO_OPTIONS:
                    combo = full_combo[0:future_chunk_length]
                    # calculate total rebuffer time for this combination (start with start_buffer and subtract
                    # each download time and add 2 seconds in that order)
                    curr_rebuffer_time = 0
                    curr_buffer = start_buffer
                    bitrate_sum = 0
                    smoothness_diffs = 0
                    last_quality = int(post_data['lastquality'])
                    for position in range(0, len(combo)):
                        chunk_quality = combo[position]
                        index = last_index + position + 1 # e.g., if last chunk is 3, then first iter is 3+0+1=4
                        download_time = (get_chunk_size(chunk_quality, index)/1000000.)/future_bandwidth # this is MB/MB/s --> seconds
                        if ( curr_buffer < download_time ):
                            curr_rebuffer_time += (download_time - curr_buffer)
                            curr_buffer = 0
                        else:
                            curr_buffer -= download_time
                        curr_buffer += 1.0
                        
                        # linear reward
                        bitrate_sum += VIDEO_BIT_RATE[chunk_quality]
                        smoothness_diffs += abs(VIDEO_BIT_RATE[chunk_quality] - VIDEO_BIT_RATE[last_quality])

                        # log reward
                        # log_bit_rate = np.log(VIDEO_BIT_RATE[chunk_quality] / float(VIDEO_BIT_RATE[0]))
                        # log_last_bit_rate = np.log(VIDEO_BIT_RATE[last_quality] / float(VIDEO_BIT_RATE[0]))
                        # bitrate_sum += log_bit_rate
                        # smoothness_diffs += abs(log_bit_rate - log_last_bit_rate)

                        # hd reward
                        # bitrate_sum += BITRATE_REWARD[chunk_quality]
                        # smoothness_diffs += abs(BITRATE_REWARD[chunk_quality] - BITRATE_REWARD[last_quality])

                        last_quality = chunk_quality
                    # compute reward for this combination (one reward per 5-chunk combo)
                    # bitrates are in Mbits/s, rebuffer in seconds, and smoothness_diffs in Mbits/s
                    
                    # linear reward 
                    reward = (bitrate_sum/1000.) - (800*curr_rebuffer_time) - (smoothness_diffs/1000.)

                    # log reward
                    # reward = (bitrate_sum) - (4.3*curr_rebuffer_time) - (smoothness_diffs)

                    # hd reward
                    # reward = (bitrate_sum) - (8*curr_rebuffer_time) - (smoothness_diffs)

                    if ( reward > max_reward ):
                        max_reward = reward
                        best_combo = combo
                # send data to html side (first chunk of best combo)
                send_data = '0' # no combo had reward better than -1000000 (ERROR) so send 0
                if ( best_combo != () ): # some combo was good
                    send_data = str(best_combo[0])

                end = time.time()
                print "TOOK: " + str(end-start)

                end_of_video = False
                if ( post_data['lastRequest'] == TOTAL_VIDEO_CHUNKS ):
                    send_data = "REFRESH"
                    end_of_video = True
                    self.input_dict['last_total_rebuf'] = 0
                    self.input_dict['last_bit_rate'] = DEFAULT_QUALITY
                    self.input_dict['video_chunk_coount'] = 0
                    self.log_file.write('\n')  # so that in the log we know where video ends

                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.send_header('Content-Length', len(send_data))
                self.send_header('Access-Control-Allow-Origin', "*")
                self.end_headers()
                self.wfile.write(send_data)

                # record [state, action, reward]
                # put it here after training, notice there is a shift in reward storage

                if end_of_video:
                    self.s_batch = [np.zeros((S_INFO, S_LEN))]
                else:
                    self.s_batch.append(state)

        def do_GET(self):
            print >> sys.stderr, 'GOT REQ'
            self.send_response(200)
            #self.send_header('Cache-Control', 'Cache-Control: no-cache, no-store, must-revalidate max-age=0')
            self.send_header('Cache-Control', 'max-age=3000')
            self.send_header('Content-Length', 20)
            self.end_headers()
            self.wfile.write("console.log('here');")

        def log_message(self, format, *args):
            return

    return Request_Handler


def run(server_class=HTTPServer, port=8333, log_file_path=LOG_FILE):

    np.random.seed(RANDOM_SEED)

    if not os.path.exists(SUMMARY_DIR):
        os.makedirs(SUMMARY_DIR)

    # make chunk combination options
    for combo in itertools.product([0,1,2,3,4,5,6,7], repeat=3):
        CHUNK_COMBO_OPTIONS.append(combo)

    with open(log_file_path, 'wb') as log_file:

        s_batch = [np.zeros((S_INFO, S_LEN))]

        last_bit_rate = DEFAULT_QUALITY
        last_total_rebuf = 0
        # need this storage, because observation only contains total rebuffering time
        # we compute the difference to get

        video_chunk_count = 0

        input_dict = {'log_file': log_file,
                      'last_bit_rate': last_bit_rate,
                      'last_total_rebuf': last_total_rebuf,
                      'video_chunk_coount': video_chunk_count,
                      's_batch': s_batch}

        # interface to abr_rl server
        handler_class = make_request_handler(input_dict=input_dict)

        server_address = ('0.0.0.0', port)
        httpd = server_class(server_address, handler_class)
        print 'Listening on port ' + str(port)
        httpd.serve_forever()


def main():
    if len(sys.argv) == 2:
        trace_file = sys.argv[1]
        run(log_file_path=LOG_FILE + '_robustMPC2_' + trace_file)
    else:
        run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print "Keyboard interrupted."
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)
