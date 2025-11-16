package models;

import io.ebean.Finder;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * ユーザー
 */
@Entity
@Getter
@Setter
@Table(name = "users")
public class Users extends BaseModel {

    /**
     * ユーザー名
     */
    @NotNull
    @Size(min = 1, max = 255)
    public String userName;

    /**
     * メールアドレス
     */
    @NotNull
    @Size(min = 1, max = 255)
    public String email;

    /**
     * 説明
     */
    public String note;

    /**
     * 部署コード
     */
    @NotNull
    @Size(min = 1, max = 3)
    public String demartmentCode;

    public static Finder<Long, Users> find = new Finder<>(Users.class);
}