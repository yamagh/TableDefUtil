package models;

import io.ebean.Finder;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * 部署
 */
@Entity
@Getter
@Setter
@Table(name = "department")
public class Department extends BaseModel {

    /**
     * 部署コード
     */
    @NotNull
    @Size(min = 1, max = 3)
    public String code;

    /**
     * 説明
     */
    public String description;

    /**
     * 部署名
     */
    @NotNull
    @Size(min = 1, max = 256)
    public String name;

    public static Finder<Long, Department> find = new Finder<>(Department.class);
}