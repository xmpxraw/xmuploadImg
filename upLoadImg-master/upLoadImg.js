/********** 上传图片 类 ************/

// 使用要修改 upLoadOne() 的url

// 初始化（参数：父容器的jq对象、可添加的图片上限）
function upLoadImg( $parent, imgMaxLength  ){

    this.imgMaxLength = imgMaxLength;// 图片最多数量（上限）
    this.shouldUploadImgLength = 0;// 要上传的图片数量
    this.imgUploadInfoArr = [];// 已上传的图片信息（name、url等）

    // 添加图片按钮 的jq对象
    this.$upLoadBtn = $('<div class="uploadDiv"><input class="uploadBtn" type="file"><img class="uploadBtn" src="addPictureBtn.png"></div>'); // demo.html中 使用这个路径
    //this.$upLoadBtn = $('<div class="uploadDiv"><input class="uploadBtn" type="file"><img class="uploadBtn" src="../img/addPictureBtn.png"></div>'); // 根据实际项目修改
    $parent.append( this.$upLoadBtn );// 添加图片按钮 加入到父容器

    this.isHideUploadBtn();// 判断是否隐藏 添加图片按钮（图片到达上限就隐藏）
    this.addBtnEvent();// 为按钮添加点击事件
}

// 为 添加图片按钮 添加点击事件
upLoadImg.prototype.addBtnEvent = function(){

    var _self = this;

    // 添加图片按钮 监听上传的文件变化（选择图片后，显示缩略图）
    var $input = this.$upLoadBtn.find('input[type=file]').eq(0);
    $input.on('change', function (e) {

        var file = e.target.files[0];//获取用户选中的文件，并获取第一张
        //console.log( $(this)[0].files[0] );
        //console.log( file );

        if (file) {
            if (/^image\//i.test(file.type)) {//判断是否是图片格式

                var reader = new FileReader();//获取文件读取器
                //文件读取器读取文件的事件监听
                reader.onloadend = function () {//文件加载完成

                    // 在 添加图片按钮 前面添加 图片缩略图
                    var $imgBox = $('<div class="imgBox" shouldUpload="true">' +
                        '<img name="' + file.name + '" src="' + reader.result + '">' +
                        '<div class="removeImg">&times;</div></div>');
                    _self.$upLoadBtn.before( $imgBox );

                    _self.isHideUploadBtn();// 图片是否已达上限，是则隐藏 上传图片按钮
                };
                reader.onerror = function () { console.error('reader error'); };
                reader.readAsDataURL(file);//实际操作，文件读取器，以URL的方式读取图片文件，使用base-64进行编码


                // 清空 input[type=file] 选中的文件记录，避免 已选择的文件不能再选（因为触发本函数的是 change事件）
                //console.log( $input );
                var inputDom = $input[0];// dom对象

                var form = document.createElement('form');// 创建form
                document.body.appendChild( form );

                var pos = inputDom.nextSibling;//记住 input[type=file] 当前的位置
                form.appendChild( inputDom );
                form.reset();// 重置form（ == 重置input[type=file]）

                pos.parentNode.insertBefore( inputDom, pos );// 把 input[type=file] 恢复到原本位置
                document.body.removeChild( form );// 移除form
            }
            else {
                alert('只能上传图片!');
                // throw '只能上传图片';
            }
        }
    });

    // 删除某张图片按钮（一定不会超出图片上限，显示 添加图片按钮）
    $(document).off('click', '.removeImg') .on('click', '.removeImg', function(){
        if( confirm('图片删除后无法恢复，确定要删除该图片？') ){
            $(this).parents('.imgBox').nextAll('.uploadDiv').show()
                .end().remove();
        }
    });

};

// 判断 是否到达图片上限（是则隐藏 上传图片按钮）
upLoadImg.prototype.isHideUploadBtn = function( file ) {
    //console.log( this.$upLoadBtn.prevAll('.imgBox').length );
    if( this.$upLoadBtn.prevAll('.imgBox').length >= this.imgMaxLength ){
        this.$upLoadBtn.hide();
    }
};

//上传 一张图片
upLoadImg.prototype.upLoadOne = function( file ){
    //console.log( arguments );

    var _self = this;
    var fd = new FormData();
    fd.append('file', dataURItoBlob(file.dataURL), file.name);
    $.ajax({
        type: 'POST',
        url:  'http://119.29.169.29/devzhaoshifu/api.php/Upload/qiniuUpload',
        data: fd,
        processData: false,
        contentType: false,
        success: function (res) {//上传成功
            //console.log( res.err_msg[0] );
            _self.imgUploadInfoArr.push( res.err_msg[0] );// 保存在 已上传的图片信息 数组中
            _self.shouldUploadImgLength --;
        },
        error: function (err) {console.log(err);}
    });

    //将图片转化为数据库的存储格式
    function dataURItoBlob(dataURI) {
        var byteString = atob(dataURI.split(',')[1]);
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        return new Blob([ab], {type: mimeString});
    }

};

//上传 所有图片
upLoadImg.prototype.upLoadAll = function(){

    var _self = this;
    var files = [];//上传的图片数组


    var _hadUploadImgBoxArr =  _self.$upLoadBtn.prevAll('.imgBox[shouldUpload!=true]');// 已上传的图片 imgBox

    // 设置 已上传的图片信息（其他页面访问该变量属性，取得上传图片的 url等信息）
    _self.imgUploadInfoArr = [];// 清空原有图片信息
    for( var i=0; i < _hadUploadImgBoxArr.length; i++ ){
        var $img = _hadUploadImgBoxArr.eq(i).find('img');
        var tempObj = { 'url': $img.attr('src') }; // url
        _self.imgUploadInfoArr.push( tempObj );
    }


    var _shouldUploadImgBoxArr =  _self.$upLoadBtn.prevAll('.imgBox[shouldUpload=true]');// 需要上传的图片 imgBox
    //console.log( _shouldUploadImgBoxArr );
    _self.shouldUploadImgLength = _shouldUploadImgBoxArr.length;// 要上传的图片数量


    // 不断监听是否上传完所有图片
    var temp= setInterval( function(){
        if( !_self.shouldUploadImgLength ){
            //console.log( _self.imgUploadInfoArr );

            $(".loader").hide(); // loading 结束
            _self.$upLoadBtn.trigger('upLoadFinish');// 触发一个“上传完成”的事件
            clearInterval( temp );
        }
    }, 50);

    for( var i=0; i < _shouldUploadImgBoxArr.length; i++ ){
        var $img = _shouldUploadImgBoxArr.eq(i).find('img');
        files.push({ name: $img.attr('name'), dataURL: $img.attr('src') });
    }

    $(".loader").show(); // loading 状态
    files.forEach( _self.upLoadOne.bind( _self ) );// 逐个上传图片（自动传入参数）
    //console.log( files );
};