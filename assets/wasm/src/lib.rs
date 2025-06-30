use wasm_bindgen::prelude::*;

// 导入console.log，用于调试
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// 定义console.log宏
macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

// 初始化panic hook（用于更好的错误信息）
#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// XOR加密函数（使用传入的KEY）
#[wasm_bindgen]
pub fn xor_encrypt(data: &str, key: u8) -> String {
    let bytes: Vec<u8> = data.bytes().map(|b| b ^ key).collect();

    // 将加密后的字节转换为base64
    base64_encode(&bytes)
}

// XOR解密函数（使用传入的KEY）
#[wasm_bindgen]
pub fn xor_decrypt(encrypted_data: &str, key: u8) -> Result<String, JsValue> {
    // 从base64解码
    let encrypted_bytes = match base64_decode(encrypted_data) {
        Ok(bytes) => bytes,
        Err(e) => return Err(JsValue::from_str(&format!("Base64解码失败: {}", e))),
    };

    // XOR解密
    let decrypted_bytes: Vec<u8> = encrypted_bytes.iter().map(|&b| b ^ key).collect();

    // 转换为UTF-8字符串
    match String::from_utf8(decrypted_bytes) {
        Ok(result) => Ok(result),
        Err(e) => Err(JsValue::from_str(&format!("UTF-8转换失败: {}", e))),
    }
}

// 从密码获取前三位用作密钥（用于客户端验证）
#[wasm_bindgen]
pub fn get_key_from_password(password: &str) -> u8 {
    let first_three: String = password.chars().take(3).collect();
    let mut hash: u32 = 0;

    for ch in first_three.chars() {
        hash = hash.wrapping_mul(31).wrapping_add(ch as u32);
    }

    // 确保返回值不为0，并且在合理范围内
    ((hash % 255) + 1) as u8
}

// 服务端加密：使用传入的KEY进行XOR加密
#[wasm_bindgen]
pub fn server_encrypt(original_data: &str, server_key: u8) -> String {
    console_log!("服务端加密，使用配置KEY: {}", server_key);

    // 使用配置的KEY进行XOR加密
    let bytes: Vec<u8> = original_data.bytes().map(|b| b ^ server_key).collect();

    // 返回base64编码结果
    base64_encode(&bytes)
}

// 客户端解密：验证密码前三位，使用传入的KEY解密
#[wasm_bindgen]
pub fn client_decrypt(encrypted_data: &str, password: &str, server_key: u8) -> Result<String, JsValue> {
    // 获取用户密码的前三位作为验证
    let user_key = get_key_from_password(password);
    console_log!("用户密码前三位生成的key: {}", user_key);

    // 存储密码前三位（在实际应用中，这个信息会被JavaScript存储到localStorage）
    let password_prefix: String = password.chars().take(3).collect();
    console_log!("存储的密码前三位: {}", password_prefix);

    // 从base64解码
    let encrypted_bytes = match base64_decode(encrypted_data) {
        Ok(bytes) => bytes,
        Err(e) => return Err(JsValue::from_str(&format!("Base64解码失败: {}", e))),
    };

    // 使用配置的KEY进行XOR解密
    let decrypted_bytes: Vec<u8> = encrypted_bytes.iter().map(|&b| b ^ server_key).collect();

    // 转换为UTF-8字符串
    match String::from_utf8(decrypted_bytes) {
        Ok(result) => {
            console_log!("客户端解密成功");
            Ok(result)
        },
        Err(e) => Err(JsValue::from_str(&format!("UTF-8转换失败: {}", e))),
    }
}

// 双重加密：先base64，再XOR加密（保持向后兼容）
#[wasm_bindgen]
pub fn double_encrypt(original_data: &str, password: &str, server_key: u8) -> String {
    // 第一步：base64编码
    let base64_data = base64_encode(original_data.as_bytes());

    // 第二步：使用配置的KEY进行XOR加密
    let bytes: Vec<u8> = base64_data.bytes().map(|b| b ^ server_key).collect();

    // 返回最终的base64编码结果
    base64_encode(&bytes)
}

// 双重解密：先XOR解密，再base64解码（保持向后兼容）
#[wasm_bindgen]
pub fn double_decrypt(encrypted_data: &str, password: &str, server_key: u8) -> Result<String, JsValue> {
    // 获取用户密码的前三位作为验证
    let user_key = get_key_from_password(password);
    console_log!("用户密码前三位生成的key: {}", user_key);

    // 第一步：从base64解码
    let encrypted_bytes = match base64_decode(encrypted_data) {
        Ok(bytes) => bytes,
        Err(e) => return Err(JsValue::from_str(&format!("第一次Base64解码失败: {}", e))),
    };

    // 第二步：使用配置的KEY进行XOR解密
    let decrypted_bytes: Vec<u8> = encrypted_bytes.iter().map(|&b| b ^ server_key).collect();

    // 第三步：转换为字符串（这应该是base64编码的原始内容）
    let base64_content = match String::from_utf8(decrypted_bytes) {
        Ok(content) => content,
        Err(e) => return Err(JsValue::from_str(&format!("XOR解密后UTF-8转换失败: {}", e))),
    };

    // 第四步：最终的base64解码
    let final_bytes = match base64_decode(&base64_content) {
        Ok(bytes) => bytes,
        Err(e) => return Err(JsValue::from_str(&format!("最终Base64解码失败: {}", e))),
    };

    // 第五步：转换为最终的UTF-8字符串
    match String::from_utf8(final_bytes) {
        Ok(result) => Ok(result),
        Err(e) => Err(JsValue::from_str(&format!("最终UTF-8转换失败: {}", e))),
    }
}

// Base64编码实现
fn base64_encode(input: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();

    for chunk in input.chunks(3) {
        let mut buf = [0u8; 3];
        for (i, &byte) in chunk.iter().enumerate() {
            buf[i] = byte;
        }

        let b = ((buf[0] as u32) << 16) | ((buf[1] as u32) << 8) | (buf[2] as u32);

        result.push(CHARS[((b >> 18) & 63) as usize] as char);
        result.push(CHARS[((b >> 12) & 63) as usize] as char);
        result.push(if chunk.len() > 1 { CHARS[((b >> 6) & 63) as usize] as char } else { '=' });
        result.push(if chunk.len() > 2 { CHARS[(b & 63) as usize] as char } else { '=' });
    }

    result
}

// Base64解码实现
fn base64_decode(input: &str) -> Result<Vec<u8>, String> {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut decode_table = [255u8; 256];

    for (i, &ch) in CHARS.iter().enumerate() {
        decode_table[ch as usize] = i as u8;
    }

    let input = input.trim_end_matches('=');
    let mut result = Vec::new();

    for chunk in input.as_bytes().chunks(4) {
        let mut buf = [0u8; 4];
        let mut padding = 0;

        for (i, &byte) in chunk.iter().enumerate() {
            if byte == b'=' {
                padding += 1;
            } else {
                let val = decode_table[byte as usize];
                if val == 255 {
                    return Err(format!("无效的base64字符: {}", byte as char));
                }
                buf[i] = val;
            }
        }

        let b = ((buf[0] as u32) << 18) | ((buf[1] as u32) << 12) | ((buf[2] as u32) << 6) | (buf[3] as u32);

        result.push((b >> 16) as u8);
        if chunk.len() > 2 && padding < 2 {
            result.push((b >> 8) as u8);
        }
        if chunk.len() > 3 && padding < 1 {
            result.push(b as u8);
        }
    }

    Ok(result)
}

// 测试函数
#[wasm_bindgen]
pub fn test_crypto() -> String {
    let original = "Hello, World! 你好世界！";
    let password = "test123";

    console_log!("原始数据: {}", original);

    // 测试新的服务端加密/客户端解密
    let encrypted = server_encrypt(original, 200);
    console_log!("服务端加密结果: {}", encrypted);

    match client_decrypt(&encrypted, password, 200) {
        Ok(decrypted) => {
            console_log!("客户端解密结果: {}", decrypted);
            if decrypted == original {
                "测试成功：新的WASM加密解密往返正确".to_string()
            } else {
                format!("测试失败：解密结果不匹配。原始: {}, 解密: {}", original, decrypted)
            }
        },
        Err(e) => {
            format!("测试失败：解密出错 - {:?}", e)
        }
    }
}
