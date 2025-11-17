package models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * RLS用のセッション情報
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SessionInfo {
    private boolean isAdmin;
    private String tenantId;
}