module.exports = {
    _get_hash:function(str){
        var fnv = require('fnv-plus');
        var seed=null, byte=1024;
        if(seed)
            fnv.seed(seed);
        return fnv.hash(str, byte).str();
    }
};