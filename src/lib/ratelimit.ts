import {Ratelimit} from "@upstash/ratelimit";
import redis from "./redis";

const rateLimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(4, "60 s"), // 4 requests per minute
})

export default rateLimit;