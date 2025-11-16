package repository;

/**
 * 楽観的ロック失敗時にスローされる例外
 */
public class OptimisticLockingFailureException extends RuntimeException {
    public OptimisticLockingFailureException(String message) {
        super(message);
    }
}