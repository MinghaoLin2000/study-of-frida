# 看雪上指纹师傅对某不良app的逆向分析，复现一手
![Image text](https://img2020.cnblogs.com/blog/2021287/202010/2021287-20201007210200475-248153408.png)

# 0x01 脱壳
这app是360的壳，用frida来脱的话，因为目前自己对脱壳掌握还不熟悉，所以还是用大佬的工具来脱，指纹师傅是用frida-unpack来脱，我就选frida-dump试试，这里我是用objection加载fridadex-dump插件来脱壳的，objection还是挺好用的，这里objection的分两种连接，一种是usb连接（有线），和无线连接，不同连接使用的命令不同，这里我也简单记录下，当然前提是手机先把frida-server启动起来，至于要不要设置非标准端口，这个由你自己决定，个人觉得有线可以随便莽，就默认端口完事，轻松，无线开qtscrcpy的话，还是设置非标准端口吧。
1. 有线：objection -g 包名 explore
2. 无线：objection -n -h ip -p port -g 包名 explore

输入两行命令后就进入了对应包名的objection命令行，然后先加载frida-dexdump插件的
plugin load 插件位置，加载后，再输入两行命令
1. plugin dexdump search
2. plugin dexdump dump

具体操作如下图所示：
![Image text](https://img2020.cnblogs.com/blog/2021287/202010/2021287-20201007210200475-248153408.png)

然后发现脱下来的dex在对应目录（图片中有显示），进去发现有很多个dex，但是只有一个是我们想要的，这里也有点技巧，比如只找有对应活动的dex
grep -ril "xxx" * 这句就是找dex中是否有该字符串或者活动,有时候一个活动还是没办法排除的话，就多找几个活动，objection安排上，直接找就完事了。
![Image text](https://img2020.cnblogs.com/blog/2021287/202010/2021287-20201007210741966-1101999118.png)