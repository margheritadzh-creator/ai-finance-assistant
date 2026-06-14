package cs.sbs.web.personalprojectweb2026.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(

        @NotBlank(message = "请输入邮箱")
        @Email(message = "邮箱格式不正确")
        @Size(max = 160, message = "邮箱长度不能超过160个字符")
        String email,

        @NotBlank(message = "请输入密码")
        @Size(
                min = 8,
                max = 72,
                message = "密码长度必须为8至72个字符"
        )
        String password
) {
}