# 用户代码 native hook
1. Frida反调试与反反调试基本思路(Java层API,Native层API,Syscall)
2. 六月题的Frida反调试的实现以及
3. Native函数的Java hook以及主动调用
4. 静态注册函数参数，返回值打印和替换

# 0x1 反调试
17种的so的反调试，同样适用于frida，另外三种的话是
1. 遍历连接手机所有端口发送`D-bus`消息，如果返回"REJECT"这个特征则认为存在frida-server
2. 直接调用`openat`的`syscall`的检测在`text`节表中搜索`frida-gadget*.so / frida-agent*.so`字符串，避免了`hook` `libc`来anti-anti的方法。
https://github.com/b-mueller/frida-detection-demo/blob/master/AntiFrida/app/src/main/cpp/native-lib.cpp
3. 内存中存在`frida rpc`字符串，认为有frida-server
https://github.com/qtfreet00/AntiFrida/blob/master/app/src/main/cpp/detect.cpp

第二种直接通过sycall来进行检测的话，就无法通过hook libc的api进行反反调试了，毕竟已经是从底层入手，用汇编sycall实现一个方法，反反调试的话，只能通过修改内核或者改硬编码了,
这里也给出手写汇编syscall方式反反调试，手写汇编调用syscall的方式，可以在内存(或so)里搜pattern，定位到具体的位置，将此处的调用patch掉。  
题外话：
不是手写汇编的方式，直接调用syscall检测frida特征。
想要anti这种反调试的话，可以：
1. 编译frida源码，所有地方改成frita；
2. 编译内核源码，hook openat 的syscall

# 0x02 native层hook入门
1. native函数的java hook
其实就是直接把native函数，当成java的函数进行操作，和之前的几乎一样，无论是动态注册还是静态的，一样的可以进行hook和主动调用。
比如这个app:  
java层的是这样的:
```
package com.example.demoso1;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;

import java.io.File;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

public class MainActivity extends AppCompatActivity {

    // Used to load the 'native-lib' library on application startup.
    static {
        System.loadLibrary("native-lib");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Example of a call to a native method
        TextView tv = findViewById(R.id.sample_text);
        tv.setText(stringFromJNI());
        //Log.i("r0add", String.valueOf(this.myfirstjni()));
        //Log.i("r0add", MainActivity.stringFromJNI());

        //init();
        while(true){
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            Log.i("r0addRegistNatives", MainActivity.stringFromJNI2());
            Log.i("r0addstatic", MainActivity.stringFromJNI());
            Log.i("r0addargs",MainActivity.myfirstjniJNI("pediy1202010"));
        }

        //testField();
        //testMethod();

    }

    public void testField(){
        Class testClazz = null ;
        try {
            testClazz = MainActivity.class.getClassLoader().loadClass("com.example.demoso1.Test");
            Log.i("r0reflection", "Classloader.loadClass->" + testClazz);
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        Class testClazz2 = null ;
        try {
            testClazz2 = Class.forName("com.example.demoso1.Test");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
        Log.i("r0reflection", "Class.forName->"+testClazz2);
        Class testClazz3 = Test.class;
        Log.i("r0reflection", ".class->"+testClazz3.getName());

        try {
            Field publicStaticField_field = testClazz3.getDeclaredField("publicStaticField");
            Log.i("r0reflection", "testClazz3.getDeclaredField->"+publicStaticField_field);
            String value = (String)publicStaticField_field.get(null);
            Log.i("r0reflection", "publicStaticField_field.get->"+value);

            Field privateStaticField_field = testClazz3.getDeclaredField("privateStaticField");
            privateStaticField_field.setAccessible(true);
            privateStaticField_field.set(null,"modified");
            String valuePrivte = (String)privateStaticField_field.get(null);
            Log.i("r0reflection", "privateStaticField_field.get->"+valuePrivte);

        } catch (NoSuchFieldException | IllegalAccessException e) {
            e.printStackTrace();
        }
        Field[] fields = testClazz3.getDeclaredFields();
        for(Field i :fields){
            Log.i("r0reflection", "testClazz3.getDeclaredFields->"+i);
        }
        Field[] fields_2 = testClazz3.getFields();
        for(Field i :fields_2){
            Log.i("r0reflection", "testClazz3.getFields->"+i);
        }


    }


    public void testMethod(){
        Class testClazz = Test.class;

        Method publicStaticFunc_method = null;
        try {
            publicStaticFunc_method = testClazz.getDeclaredMethod("publicStaticFunc");
            Log.i("r0reflection", "testClazz.getDeclaredMethod->"+publicStaticFunc_method);
            publicStaticFunc_method.invoke(null);
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }


        Method privateStaticFunc_method = null;
        try {
            privateStaticFunc_method = testClazz.getDeclaredMethod("privateStaticFunc");
            Log.i("r0reflection", "testClazz.getDeclaredMethod->"+privateStaticFunc_method);
            privateStaticFunc_method.setAccessible(true);
            privateStaticFunc_method.invoke(null);
        } catch (NoSuchMethodException e) {
            e.printStackTrace();
        } catch (IllegalAccessException e) {
            e.printStackTrace();
        } catch (InvocationTargetException e) {
            e.printStackTrace();
        }


        Method[] methods = testClazz.getMethods();
        for(Method i : methods){
            Log.i("r0reflection", "testClazz.getMethods()->"+i);
        }

        Method[] methods2= testClazz.getDeclaredMethods();
        for(Method i:methods2){
            Log.i("r0reflection", "testClazz.getDeclaredMethods->"+i);
        }

    };


    /**
     * A native method that is implemented by the 'native-lib' native library,
     * which is packaged with this application.
     */

    public static native String stringFromJNI();
    public static native String stringFromJNI2();
    public static native String myfirstjniJNI(String context);
    public native int myfirstjni();
    public native int init();
}
```
jni层:
```
#include <jni.h>
#include <pthread.h>
#include <string>
#include <android/log.h>
#include <sys/socket.h>
#include <unistd.h>
#include <netinet/in.h>
#include <arpa/inet.h>

#define APPNAME "FridaDetectionTest"

#define  TAG    "r0add"

// 定义info信息

#define LOGI(...) __android_log_print(ANDROID_LOG_INFO,TAG,__VA_ARGS__)

// 定义debug信息

#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, TAG, __VA_ARGS__)

// 定义error信息

#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR,TAG,__VA_ARGS__)

int r0add(int x,int y){
    int i ;
    for (i = 0; i<x; i++){
        LOGI("now i is %i",i);
        i=i+y;
    }
    return i;
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_example_demoso1_MainActivity_stringFromJNI(
        JNIEnv* env,
        jclass clazz) {

    jclass testClass = env->FindClass("com/example/demoso1/Test");
    //jfieldID GetStaticFieldID(jclass clazz, const char* name, const char* sig)
    jfieldID publicStaticField = env->GetStaticFieldID(testClass,"publicStaticField","Ljava/lang/String;");
    jstring publicStaticField_value = (jstring)env->GetStaticObjectField(testClass,publicStaticField);

    const char* value_ptr = env->GetStringUTFChars(publicStaticField_value, nullptr);
    LOGI("now content is %s",value_ptr);

    std::string hello = "Hello from C++";
    return env->NewStringUTF(hello.c_str());
}



extern "C" JNIEXPORT jstring JNICALL
Java_com_example_demoso1_MainActivity_myfirstjniJNI(
        JNIEnv* env,
        jclass,jstring content ) {
    const char* a = env->GetStringUTFChars(content, nullptr);
    int content_size = env->GetStringUTFLength(content);
    if(a!=0){
        LOGI("now a is %s",a);
        LOGI("now content is %s",content);
    }
    env->ReleaseStringUTFChars(content,a);
    jstring result = env->NewStringUTF("Hello I`m from myfirstjnienv!");
    return result;
}


extern "C" JNIEXPORT jint JNICALL
Java_com_example_demoso1_MainActivity_myfirstjni(
        JNIEnv* env,
        jobject clazz) {
    return r0add(50,1);
}


void *detect_frida_loop(void *) {
    struct sockaddr_in sa;
    memset(&sa, 0, sizeof(sa));
    sa.sin_family = AF_INET;
    inet_aton("0.0.0.0", &(sa.sin_addr));
    int sock;
    int i;
    int ret;
    char res[7];
    while(1){
        /*
         * 1:Frida Server Detection
         */
        //LOGI("entering frida server detect loop started");
        for(i=20000;i<30000;i++){
            sock = socket(AF_INET,SOCK_STREAM,0);
            sa.sin_port = htons(i);
            LOGI("entering frida server detect loop started,now i is %d",i);

            if (connect(sock , (struct sockaddr*)&sa , sizeof sa) != -1) {
                memset(res, 0 , 7);
                send(sock, "\x00", 1, NULL);
                send(sock, "AUTH\r\n", 6, NULL);
                usleep(500); // Give it some time to answer
                if ((ret = recv(sock, res, 6, MSG_DONTWAIT)) != -1) {
                    if (strcmp(res, "REJECT") == 0) {
                        LOGI("FOUND FRIDA SERVER: %s,FRIDA DETECTED [1] - frida server running on port %d!",APPNAME,i);
                    }else{
                        LOGI("not FOUND FRIDA SERVER");
                    }
                }
            }
            close(sock);
        }
    }
}


extern "C" JNIEXPORT void JNICALL
Java_com_example_demoso1_MainActivity_init(
        JNIEnv* env,
        jobject clazz) {

    pthread_t t;
    pthread_create(&t,NULL,detect_frida_loop,(void*)NULL);

    LOGI("frida server detect loop started");
}

JNIEXPORT jstring JNICALL stringFromJNI2(
        JNIEnv* env,
        jclass clazz) {

    jclass testClass = env->FindClass("com/example/demoso1/Test");
    //jfieldID GetStaticFieldID(jclass clazz, const char* name, const char* sig)
    jfieldID publicStaticField = env->GetStaticFieldID(testClass,"publicStaticField","Ljava/lang/String;");
    jstring publicStaticField_value = (jstring)env->GetStaticObjectField(testClass,publicStaticField);

    const char* value_ptr = env->GetStringUTFChars(publicStaticField_value, nullptr);
    LOGI("now content is %s",value_ptr);


    std::string hello = "Hello from C++ stringFromJNI2";
    return env->NewStringUTF(hello.c_str());
}

JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* reserved){
    JNIEnv *env;
    vm->GetEnv((void **) &env, JNI_VERSION_1_6);
    JNINativeMethod methods[] = {
            {"stringFromJNI2", "()Ljava/lang/String;", (void *) stringFromJNI2},
    };
    env->RegisterNatives(env->FindClass("com/example/demoso1/MainActivity"), methods, 1);
    return JNI_VERSION_1_6;
```
这里我写的hook代码，其实和java hook的东西完全一样的，毕竟只要在java层声明了，那么必然还是得遵循java层的逻辑来操作。
```
function main()
{
    Java.perform(function(){
        Java.use("com.example.demoso1.MainActivity").stringFromJNI.implementation=function(){
            var result=this.stringFromJNI();
            console.log("result is->",result);
            return result;
        }
        console.log("invoke stringFromJNI : =>"+Java.use("com.example.demoso1.MainActivity").stringFromJNI()); 
        Java.use("com.example.demoso1.MainActivity").stringFromJNI2.implementation=function(){
            var result=this.stringFromJNI2();
            console.log("result is->",result);
            return result;
        }
        console.log("invoke stringFromJNI2 : =>"+Java.use("com.example.demoso1.MainActivity").stringFromJNI2()); 
        Java.use("com.example.demoso1.MainActivity").init.implementation=function(){
            console.log("hook init successfully");
            return this.init();
        }
        Java.choose("com.example.demoso1.MainActivity",{
            onMatch:function(instance){
                console.log("Found instance",instance);
                instance.myfirstjniJNI();

            },onComplete:function(){console.log("search complete!")}
        })
    })
}
```
2. native函数的native hook  
这里终于进入了主题，毕竟在正式逆向或者ctf中，大部分加密还是在自定义的函数中的，虽然今天这节课也没说2333，估计等下次课了。这里我直接放hook的代码根据代码来讲解可能会好一点
```
function hook_nativelib()
{
    var native_lib_addr=Module.findBaseAddress("libnative-lib.so");
    console.log("native_lib_addr ->",native_lib_addr);
    var myfirstjniJNI=Module.findExportByName("libnative-lib.so","Java_com_example_demoso1_MainActivity_myfirstjniJNI");
    console.log("myfirstjiniJNI addr ->",myfirstjniJNI);
    Interceptor.attach(myfirstjniJNI,{
        onEnter:function(args){
            //console.log("Interceptor.attach myfirstjniJNI args:",args[0],args[1],args[2]);
            //console.log("jstring is",Java.vm.getEnv().getStringUtfChars(args[2],null).readCString());
        },onLeave:function(reval){
            //console.log("Interceptor.attach myfirstjniJNI retval",reval);
        }
    })
}
function main1()
{
    hook_nativelib();
}
setImmediate(main1);
```
## 操作步骤：
1. objection先打开，然后memory list modules，查看一下加载的so文件，然后再进一步查看导出函数有哪些，这步和在ida中查看其实是一样的。
2. 先找到so的基址(Module.findBaseAddress("模块名")),然后如果hook在java层有定义的方法，或者直接知道native函数在jni中的函数名，可以直接使用Module.findExportByName("模块名","jni中的函数名")，可以直接找出虚拟地址，大多数自定义函数，得先找出偏移，加上模块的基址
3. 再调用Interceptor.attach("之前找的jni函数虚拟地址",{
    onEnter:function(args){
        这里是输入，也就是参数的地方，
        args是参数的数组形式，不过存到好像是args的地址，所以需要有特殊的函数进行转换，上次nu1lctf中看到有个师傅的手法是ptr(args[0]).readCString(),比上面那行代码简洁，上面的话，实际就是根据jni开发的手法进行的，无论是javahook还是nativehook，最终都是变成开发的问题。
    },onLeave:function(reval){
        
    }
})
4. 开发很重要