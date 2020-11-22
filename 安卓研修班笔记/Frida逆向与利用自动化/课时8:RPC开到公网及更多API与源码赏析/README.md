# RPC开到公网以及更多API与源码赏析
# 更多API
1. frida(rpc)开到公网集群+(或flask)
2. child-gating,上传到PC打印
3. ZenTrace
4. FRIDA-DEXDump
5. objection

# 0x01 frida(rpc)开到公网集群+（或flask）
这里太骚了，本来以为手机是内网，如果不在一个路由器下，rpc就难调用了，没想到啊，这波是直接通过公网的一台服务器映射到内网的ip和端口上，那么只要我们rpc到公网的ip和端口，那么直接转发到内网机器进行操作，直接起飞，多台手机甚至可以同时操作，细思极恐，问题我服务器首先没有，淦，其次一些计网知识直接缺失了，有点难过，现在去补补看看，实在不行，服务器还是得整上！  
___  
阿里云买了台vps，感觉还是蛮香的，立马安装上了nps，然后在阿里云的安全组里，把8080端口打开了，之后ip加8080端口就可以访问后台的web端了.  
安装参考链接:  
https://www.cnblogs.com/jimaojin/p/12381656.html  
https://ehang-io.github.io/nps/#/nps_use  
___
下一步开始配置我的客户端