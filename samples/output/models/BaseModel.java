package models;

import io.ebean.Model;
import io.ebean.annotation.WhenCreated;
import io.ebean.annotation.WhenModified;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

/**
 * 全テーブル共通の項目を定義する基底モデル
 */
@MappedSuperclass
@Getter
@Setter
public class BaseModel extends Model {
    @Id
    public Long id;

    /**
     * 論理削除フラグ
     */
    public Boolean isDeleted = false;

    /**
     * 作成日時
     */
    @WhenCreated
    public Instant createdAt;
    
    /** 
     * 作成者ID
     */
    public String createdBy;

    /**
     * 更新日時
     */
    @WhenModified
    public Instant updatedAt;
    
    /**
     * 更新者ID
     */
    public String updatedBy;
}