function MODULE(){
    var native_lib_addr = Process.findModuleByAddress(Module.findBaseAddress("linker64"));
    console.log("native_lib_addr => ",JSON.stringify(native_lib_addr));
    console.log("enumerateImports=>",JSON.stringify(native_lib_addr.enumerateSymbols()))

}
setImmediate(MODULE)