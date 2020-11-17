# Frida简介
1. objection与frida版本匹配安装
2. objection连接非标准端口
3. objection内存漫游,hook,trace
4. objection插件体系:Wallbreaker
5. objection + DEXDump脱壳

# 0x01 objection安装
objection安装是使用pip install来进行安装，一般是与frida的版本来匹配的具体操作流程挂个肉丝的
星球，里面介绍的非常详细
https://wx.zsxq.com/dweb2/index/search/%E7%89%B9%E5%AE%9A%E7%89%88%E6%9C%AC
pip install objection==xxx(版本号)
如果没加版本号，会直接安装新的
这里插一嘴，pyenv这玩意管理python环境是真的香，这里记录几个pyenv的命令
1. pyenv versions 查看管理的所有python的版本
2. pyenv local xxx(python的版本) 切换python版本
切换完后面再pip！

